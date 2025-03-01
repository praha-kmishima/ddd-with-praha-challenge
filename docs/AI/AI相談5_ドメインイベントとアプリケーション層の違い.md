## 質問

```
​ドメインイベントと、複数集約をまたぐユースケースを実装するアプリケーション層の実装の違いがあまりイメージできていません。

DDD実装にあたって、この２つの使い分けというか、基準というか、観点というか、どういったメンタルモデルで責務を考えていくのでしょうか
```

## 解答

<think>この質問は非常に良い質問です。ドメインイベントとアプリケーション層のユースケース実装の違いと使い分けについて説明する必要があります。これはDDDにおいて多くの実装者が混乱するポイントの一つです。

以下の観点から説明します：
1. それぞれの責務と目的
2. 使い分けの基準
3. 両者の関係性と連携方法
4. どのような状況でどちらを選ぶべきか
5. 具体的な例を用いた説明

特に重要なのは、「押し込める」vs「引き出す」パターン、同期処理と非同期処理、境界づけられたコンテキスト間の統合方法などの観点です。</think># ドメインイベントとアプリケーション層の使い分け

ドメインイベントと複数集約をまたぐアプリケーション層の実装の違いは、多くの開発者が混乱するポイントです。それぞれの役割と使い分けについて、メンタルモデルを構築するための観点を説明します。

## 両者の基本的な責務と特徴

### ドメインイベント
- **定義**: ドメインで発生した重要な「事実」を表現するオブジェクト（過去形で表現）
- **発生源**: 集約内部の状態変更
- **伝播方向**: 発生源からの「プッシュ型」通知
- **結合度**: 発行者は購読者を知らない（疎結合）
- **実行パターン**: 多くの場合、非同期実行

### アプリケーション層のユースケース
- **定義**: ユーザーの意図を実現するための一連の処理フロー
- **開始点**: 外部からのリクエスト（APIやUI）
- **呼び出し方向**: 必要なドメインサービスや集約を「プル型」で呼び出し
- **結合度**: オーケストレーターとして複数の集約を明示的に連携（密結合）
- **実行パターン**: 多くの場合、単一トランザクション内での同期実行

## 使い分けの基準と観点

### 1. 時間的結合の強さ

- **アプリケーション層を選ぶ場合**:
  - 即時性が求められる
  - 一連の処理が論理的に一つのトランザクションとして完結すべき
  - 例: 参加者の休会処理とチームからの離脱は同時に行われるべき

- **ドメインイベントを選ぶ場合**:
  - 結果整合性（Eventually Consistent）で許容される
  - 処理の分離が自然である
  - 例: チームが1人になったことを検知して管理者に通知する処理

### 2. 処理の発生源と主導権

- **アプリケーション層を選ぶ場合**:
  - ユーザーのアクションから直接始まる処理
  - 処理フローが明確に定義されている
  - 例: ユーザーがUI上で「休会する」ボタンを押した時の処理

- **ドメインイベントを選ぶ場合**:
  - 内部状態変更の副作用として処理が始まる
  - 処理フローが状況に応じて動的に決まる
  - 例: チームメンバーシップの変更に反応した処理

### 3. 関心事の分離と拡張性

- **アプリケーション層を選ぶ場合**:
  - 処理の流れを明示的に制御したい
  - 責任の所在を明確にしたい
  - 例: 参加者ステータス変更の全体フロー制御

- **ドメインイベントを選ぶ場合**:
  - 新たな要件追加で処理を拡張したい
  - 集約の関心事を分離したい
  - 例: 将来、参加者ステータス変更時に新たな処理を追加したい場合

## 具体的な実装パターンとメンタルモデル

### 複合パターン: ユースケースを中心に、ドメインイベントを補助的に使う

```
[ユーザーリクエスト] → [アプリケーション層ユースケース] → [ドメイン処理]
                                                    ↓
                              [イベント購読者] ← [ドメインイベント]
```

### 例: 参加者の休会処理

```typescript
// アプリケーション層のユースケース
class ParticipantStatusChangeUseCase {
  @Transactional
  async changeToInactive(participantId: string): Promise<void> {
    // 同期処理（主要フロー）
    const participant = await this.participantRepository.findById(participantId);
    const oldStatus = participant.getStatus();
    
    participant.changeStatus(EnrollmentStatus.INACTIVE); // イベント発行
    
    // チームからの離脱処理（同期的に必要な処理）
    if (oldStatus === EnrollmentStatus.ACTIVE) {
      const membership = await this.teamMembershipRepository.findByParticipantId(participantId);
      if (membership) {
        const teamId = membership.getTeamId();
        await this.teamMembershipRepository.remove(membership);
        
        // 同期的に必要なチーム処理
        const team = await this.teamRepository.findById(teamId);
        team.removeMember(participantId);
        await this.teamRepository.save(team);
      }
    }
    
    await this.participantRepository.save(participant);
    
    // 注: 内部でのイベント発行はドメインモデル内で行われる
    // participant.changeStatus() 内で ParticipantStatusChangedEvent を発行
  }
}

// ドメインモデル内のイベント発行
class Participant {
  changeStatus(newStatus: EnrollmentStatus): void {
    if (!this.status.canTransitionTo(newStatus)) {
      throw new InvalidStatusTransitionException();
    }
    
    const oldStatus = this.status;
    this.status = newStatus;
    
    // ドメインイベント発行
    DomainEvents.publish(new ParticipantStatusChangedEvent(
      this.id, oldStatus, this.status
    ));
  }
}

// イベントハンドラ（非同期処理に適した副作用）
class TeamReorganizationEventHandler {
  @EventHandler
  async handleParticipantStatusChanged(event: ParticipantStatusChangedEvent): Promise<void> {
    if (event.oldStatus === EnrollmentStatus.ACTIVE && 
        event.newStatus !== EnrollmentStatus.ACTIVE) {
      
      // チームサイズ確認と必要な場合の再編成アクション（非同期でも許容可能な処理）
      const team = await this.teamRepository.findByFormerMemberId(event.participantId);
      if (team && team.getMemberCount() < 2) {
        if (team.getMemberCount() === 1) {
          // チーム再編成プロセス開始
          await this.teamReorganizationService.handleUnderflowTeam(team.getId());
        } else {
          // 管理者通知のみ
          await this.notificationService.notifyAdminAboutUnderflowTeam(
            team, event.participantId
          );
        }
      }
    }
  }
}
```

## 使い分けのメンタルモデル

1. **必須性と即時性の観点**
   - **アプリケーション層で実装**: ビジネスルールとして必ず実行される必要があり、即時性が求められる処理
   - **ドメインイベントで実装**: あると便利だが、多少遅れても問題ない、または状況によって実行されるべき処理

2. **関心事の分離の観点**
   - **アプリケーション層で実装**: メインの処理フロー、トランザクション整合性を保つべき処理
   - **ドメインイベントで実装**: 副作用的な処理、異なる集約に関連するが独立して考えられる処理

3. **拡張性の観点**
   - **アプリケーション層で実装**: フローが明確で変化が少ない処理
   - **ドメインイベントで実装**: 将来的に処理が追加される可能性がある箇所

## 実際のシステムでの使い分け例（プラハチャレンジケース）

1. **アプリケーション層で実装するべき処理**:
   - 参加者の在籍状態変更とチームメンバーシップの同期的な更新
   - 休会者の復帰時のチーム割り当て処理

2. **ドメインイベントで実装するべき処理**:
   - チームサイズの変化に基づく管理者通知
   - チームサイズが1名になった場合の再編成処理
   - 統計情報の更新

## まとめ

アプリケーション層とドメインイベントは対立するものではなく、相補的な関係にあります。複雑なシステムでは両方を適切に組み合わせることで、責務の明確な分離と、拡張性の高いシステムを実現できます。

- **アプリケーション層**: メインのユースケースフローの制御と同期的な処理の調整
- **ドメインイベント**: 疎結合な連携と非同期的な副作用の実現

重要なのは、ビジネスの要件とシステムの特性を理解した上で、適切なパターンを選択することです。
