## 質問

```
小規模プロジェクトなので、単一トランザクションになりそうです。
この場合、@仕様.md この仕様のような、ユーザやチームの仕様はどこで表現されるべきなのでしょうか
先ほどの単一トランザクション処理において、責務をもつべきドメインルールは存在するでしょうか
```

## 解答

<think>このユーザーは、単一トランザクションアプローチを採用する際に、仕様書にあるドメインルールをどこでどのように表現すべきかを質問しています。特に、参加者のステータス変更がチーム所属に影響する複雑なルールについて、責務の所在を明確にしたいようです。

仕様書の内容を確認すると：

1. 参加者が休会・退会するとチームから離脱する必要がある
2. これによりチームサイズが2名未満になる場合の特別処理
3. チームが1名になる場合は自動的に他チームに合流する複雑なルール
4. 参加者の復帰時のチーム配属ルール
5. チームが5名になる場合の分解ルール

これらは単一トランザクションでの実装を前提に、どのドメインオブジェクトやサービスが責務を持つべきかを考える必要があります。</think># ドメインルールの表現と責務の配置について

小規模プロジェクトで単一トランザクションアプローチを採用する場合の、ドメインルールの表現と責務の配置について説明します。

## 仕様の表現場所と責務の割り当て

仕様書にある複雑なルールは、以下のような形で表現・実装すべきです：

### 1. 基本的なドメインルール（集約内の整合性）

各集約の内部で表現すべき基本ルール：

```java
// Participantエンティティ内
class Participant {
    private EnrollmentStatus status;
    
    public void changeStatus(EnrollmentStatus newStatus) {
        // ステータス遷移の基本ルールを検証
        if (!this.status.canTransitionTo(newStatus)) {
            throw new InvalidStatusTransitionException();
        }
        this.status = newStatus;
    }
    
    public boolean canJoinTeam() {
        // 在籍中の参加者だけがチームに所属可能というルール
        return this.status == EnrollmentStatus.ACTIVE;
    }
}

// Teamエンティティ内
class Team {
    private List<ParticipantId> members;
    
    public void addMember(ParticipantId participantId) {
        if (members.size() >= 4) {
            throw new TeamFullException();
        }
        members.add(participantId);
    }
    
    public void removeMember(ParticipantId participantId) {
        members.remove(participantId);
    }
    
    public int getMemberCount() {
        return members.size();
    }
}
```

### 2. 複雑なドメインサービス（集約横断ルール）

集約を横断する複雑なルールは、ドメインサービスで表現：

```java
// ドメインサービス
class TeamAssignmentService {
    // チーム再編成ロジック
    public void handleTeamReorganization(Team team, Participant leavingParticipant) {
        if (team.getMemberCount() == 2) {
            // 2名から1名になるケース - 管理者通知
            notificationService.sendTeamUnderSizeWarning(team, leavingParticipant);
        }
        else if (team.getMemberCount() == 1) {
            // 1名になるケース - 自動合流処理
            Participant remainingParticipant = getRemainingParticipant(team);
            Team targetTeam = findMergeTargetTeam();
            
            if (targetTeam != null) {
                // 合流先があれば合流処理
                team.removeMember(remainingParticipant.getId());
                targetTeam.addMember(remainingParticipant.getId());
            } else {
                // 合流先がなければ管理者通知
                notificationService.sendNoMergeTargetWarning(remainingParticipant, leavingParticipant);
            }
        }
    }
    
    // 参加者復帰時のチーム配属ロジック
    public Team assignTeamToReturningParticipant(Participant participant) {
        // 最小人数チーム検索ロジック
        Team targetTeam = findSmallestTeam();
        
        if (targetTeam.getMemberCount() == 4) {
            // 5人になる場合の自動分割ロジック
            return splitTeam(targetTeam, participant);
        } else {
            targetTeam.addMember(participant.getId());
            return targetTeam;
        }
    }
    
    // チーム分割ロジック
    private Team splitTeam(Team existingTeam, Participant newParticipant) {
        // 実装省略 - チームをランダムに2つに分割
    }
}
```

### 3. アプリケーションサービス（ユースケース調整）

実際のトランザクションを扱うアプリケーションサービス：

```java
// アプリケーションサービス
class ParticipantStatusChangeService {
    private ParticipantRepository participantRepository;
    private TeamRepository teamRepository;
    private TeamAssignmentService teamAssignmentService;
    
    // 単一トランザクション内で参加者ステータス変更とチーム所属処理を実行
    @Transactional
    public void changeParticipantStatus(ParticipantId participantId, EnrollmentStatus newStatus) {
        // 1. 参加者取得
        Participant participant = participantRepository.findById(participantId);
        EnrollmentStatus oldStatus = participant.getStatus();
        
        // 2. ステータス変更
        participant.changeStatus(newStatus);
        
        // 3. 必要に応じてチーム関連処理
        if (oldStatus == EnrollmentStatus.ACTIVE && 
            (newStatus == EnrollmentStatus.INACTIVE || newStatus == EnrollmentStatus.WITHDRAWN)) {
            // 在籍中→休会/退会の場合
            Team team = teamRepository.findTeamByMemberId(participantId);
            if (team != null) {
                // チームからの離脱と再編成
                team.removeMember(participantId);
                teamAssignmentService.handleTeamReorganization(team, participant);
                teamRepository.save(team);
            }
        } 
        else if (newStatus == EnrollmentStatus.ACTIVE && 
                (oldStatus == EnrollmentStatus.INACTIVE || oldStatus == EnrollmentStatus.WITHDRAWN)) {
            // 休会/退会→在籍中の場合
            Team team = teamAssignmentService.assignTeamToReturningParticipant(participant);
            teamRepository.save(team);
        }
        
        // 4. 参加者保存
        participantRepository.save(participant);
    }
}
```

## ドメインルールの責務配置のポイント

このような構造にすることで、以下のようなメリットがあります：

1. **ドメインモデルの純粋性維持**
   - 基本的な整合性ルールは各集約内に閉じ込める
   - ParticipantとTeamはそれぞれの集約としての責務を果たす

2. **ドメインサービスによる複雑ルールの分離**
   - チーム再編成などの複雑なルールはドメインサービスに分離
   - 集約間の関係を扱うポリシーを明確に表現

3. **アプリケーションサービスでのワークフロー調整**
   - トランザクション境界を管理
   - 各ドメインオブジェクト・サービスの連携を調整

4. **責務の明確な分担**
   - 集約：個別の整合性ルール
   - ドメインサービス：複雑な業務ルール（チーム再編、合流など）
   - アプリケーションサービス：トランザクション管理とワークフロー

## 重要なポイント

この仕様を実装する際、以下の点に注意すべきです：

1. **集約境界を超えたルールは明示的なドメインサービスとして定義する**
   - これにより、複雑なビジネスルールが散らばることを防止

2. **単一トランザクションでも責務は適切に分離する**
   - トランザクションが単一でも、ドメインロジックの責務は適切に分配すべき

3. **豊富なドメインモデルを目指す**
   - 振る舞いを持つドメインモデルで、ビジネスルールを明示的に表現

このアプローチにより、小規模プロジェクトでも拡張性と保守性の高いドメインモデルを実現できます。
