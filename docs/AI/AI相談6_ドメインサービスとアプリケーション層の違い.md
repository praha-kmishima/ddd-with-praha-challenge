## 質問

```
​ドメインサービスと、複数集約をまたぐユースケースを実装するアプリケーション層の実装の違いがあまりイメージできていません。

DDD実装にあたって、この２つの使い分けというか、基準というか、観点というか、どういったメンタルモデルで責務を考えていくのでしょうか
```

## 解答

<think>これは非常に良い質問です。DDDにおけるドメインサービスとアプリケーションサービス（ユースケース層）の違いは、多くの開発者が混乱するポイントです。それぞれの役割と責務の区別について、明確な説明を提供したいと思います。

まず、それぞれの基本的な役割を整理します：

### ドメインサービス
- ドメインロジックを扱う
- 複数の集約にまたがるドメインの概念やルールを表現する
- 特定の集約に自然に属さないドメインロジックを含む
- ドメインモデルの一部

### アプリケーションサービス
- ユースケースのオーケストレーションを行う
- 複数のドメインサービスや集約を組み合わせてユースケースを実現する
- トランザクションの境界を管理する
- 技術的な関心事（認証、認可、入出力の変換など）を扱う

これらの概念を区別するためのメンタルモデルとして、以下のポイントを説明します：

1. ドメインサービスは「何を」に焦点を当て、アプリケーションサービスは「どのように」に焦点を当てる
2. ドメインサービスはドメインの言語で表現され、アプリケーションサービスはユースケースの言語で表現される
3. ドメインサービスは再利用可能なドメインロジックを含み、アプリケーションサービスは特定のユースケースに特化している
4. ドメインサービスは永続化や通知などの技術的関心事を含まず、アプリケーションサービスはそれらを調整する

具体例として、チーム再編成の例を使って両者の違いを説明します。</think># ドメインサービスとアプリケーションサービスの違いと使い分け

ドメインサービスとアプリケーションサービス（ユースケース層）の違いは理解が難しいポイントですね。両者の責務の違いと使い分けについて説明します。

## 基本的な責務の違い

### ドメインサービス
- **ドメイン知識を表現する**：集約に属さない純粋なビジネスロジックを実装
- **「何を」と「なぜ」に焦点**：ビジネスルールやドメインの概念を表現
- **技術的詳細を含まない**：永続化、通知、トランザクション管理などは扱わない
- **集約のクライアント**：集約を操作するが、それ自体がユースケースを完遂しない

### アプリケーションサービス
- **ユースケースを調整する**：ドメインサービス、集約、外部サービスを組み合わせて調整
- **「どのように」に焦点**：ユースケースの手順やフローを管理
- **技術的関心事を扱う**：トランザクション、認可、入出力変換など
- **インターフェースアダプター**：外部世界とドメイン層の仲介役

## 役割の比較：チーム再編成の例

プラハチャレンジのチーム再編成を例に考えましょう：

### ドメインサービスの例 `TeamReorganizationService`

```typescript
// ドメインサービス：純粋なドメインロジックのみを含む
class TeamReorganizationService {
  // 最も小さいチームを見つけるロジック
  findOptimalTeamForMember(teams: Team[], participant: Participant): Team | null {
    // 参加可能なチームをフィルタリング
    const eligibleTeams = teams.filter(team => team.canAcceptMember());
    
    if (eligibleTeams.length === 0) return null;
    
    // 最も人数が少ないチームを見つける
    return eligibleTeams.reduce((smallest, current) => 
      current.getMemberCount() < smallest.getMemberCount() ? current : smallest
    , eligibleTeams[0]);
  }
  
  // チーム分割のロジック（ドメインの知識）
  splitTeam(team: Team, participants: Participant[]): [Team, Team] {
    // チームを分割する純粋なドメインロジック
    // - どのように参加者を2つのチームに分けるか
    // - 新しいチーム名をどう決めるか
    // - どの参加者がどちらのチームに行くべきか

    // 実装の詳細は省略
    // ...
    
    return [newTeam1, newTeam2];
  }
}
```

### アプリケーションサービスの例 `ParticipantReturnUseCase`

```typescript
// アプリケーションサービス：ユースケースのオーケストレーション
class ParticipantReturnUseCase {
  constructor(
    private participantRepository: ParticipantRepository,
    private teamRepository: TeamRepository,
    private teamMembershipRepository: TeamMembershipRepository,
    private teamReorganizationService: TeamReorganizationService, // ドメインサービス使用
    private notificationService: NotificationService // 技術的関心事
  ) {}

  @Transactional // トランザクション管理（技術的関心事）
  async executeParticipantReturn(participantId: string): Promise<void> {
    // 1. 参加者の取得と状態変更（リポジトリとのやり取り）
    const participant = await this.participantRepository.findById(
      new ParticipantId(participantId)
    );
    participant.changeStatus(EnrollmentStatus.ACTIVE);
    
    // 2. 既存のチーム一覧を取得（リポジトリとのやり取り）
    const teams = await this.teamRepository.findAll();
    
    // 3. ドメインサービスを使用して最適チームを見つける
    const targetTeam = this.teamReorganizationService.findOptimalTeamForMember(
      teams, participant
    );
    
    if (!targetTeam) {
      // 4. 例外処理（管理者通知など）
      await this.notificationService.notifyAdmin(
        "合流先チームがありません", participant
      );
      return;
    }
    
    // 5. チームに参加者を追加
    if (targetTeam.getMemberCount() === 4) {
      // 5a. チームが満員になる場合の分割処理
      const participants = await this.getTeamParticipants(targetTeam);
      participants.push(participant);
      
      // ドメインサービスを使ってチーム分割ロジックを実行
      const [team1, team2] = this.teamReorganizationService.splitTeam(
        targetTeam, participants
      );
      
      // 分割結果の永続化（リポジトリとのやり取り）
      await this.teamRepository.remove(targetTeam);
      await this.teamRepository.save(team1);
      await this.teamRepository.save(team2);
      
      // メンバーシップ再作成（リポジトリとのやり取り）
      // ...
    } else {
      // 5b. 通常のチーム参加処理
      targetTeam.addMember(participant.getId());
      await this.teamRepository.save(targetTeam);
      
      // メンバーシップ作成
      const membership = new TeamMembership(
        TeamMembershipId.generate(),
        participant.getId(),
        targetTeam.getId()
      );
      await this.teamMembershipRepository.save(membership);
    }
    
    // 6. 参加者情報保存
    await this.participantRepository.save(participant);
    
    // 7. 成功通知（オプション）
    await this.notificationService.notifyParticipant(
      participant, "チーム参加が完了しました"
    );
  }
  
  // 補助メソッド
  private async getTeamParticipants(team: Team): Promise<Participant[]> {
    // 実装省略
    // ...
  }
}
```

## 区別するためのメンタルモデル

以下の観点でドメインサービスとアプリケーションサービスを区別すると良いでしょう：

### 1. 「言語」に注目する
- **ドメインサービス**：ドメインの言語でメソッドが表現される
  - `findOptimalTeamForMember()`, `splitTeam()`, `mergeUnderflowTeam()`
- **アプリケーションサービス**：ユースケースの言語でメソッドが表現される
  - `executeParticipantReturn()`, `handleParticipantStatusChange()`

### 2. 呼び出し元に注目する
- **ドメインサービス**：アプリケーションサービスから呼び出される
- **アプリケーションサービス**：コントローラーや外部イベントハンドラーから呼び出される

### 3. 依存関係に注目する
- **ドメインサービス**：
  - 他のドメインサービス、集約、値オブジェクトのみに依存
  - リポジトリ、通知サービスなどの技術的コンポーネントに依存しない
- **アプリケーションサービス**：
  - ドメインサービス、集約、リポジトリ、通知サービスなど幅広く依存

### 4. 再利用性に注目する
- **ドメインサービス**：複数のユースケースで再利用される
- **アプリケーションサービス**：特定のユースケースに特化している

## 具体的なガイドライン

1. **ドメインサービスに含めるべきもの**：
   - 複数集約にまたがるドメインロジック（例：チーム再編成アルゴリズム）
   - ドメイン固有のビジネスルール（例：進捗ステータス遷移の検証）
   - 値オブジェクトやエンティティの生成ルール（例：チーム命名ルール）

2. **アプリケーションサービスに含めるべきもの**：
   - ユースケースの調整（例：参加者復帰のフロー全体）
   - リポジトリとの連携（データ取得・保存）
   - トランザクション境界の管理
   - 認証・認可のチェック
   - 入出力の変換
   - 通知や外部サービス連携

## 実装上のヒント

- ドメインサービスには純粋なドメインロジックのみを含め、その内部でリポジトリを直接呼び出さない
- ドメインサービスをテストする際は、モックが不要（または最小限）になるはず
- アプリケーションサービスは「薄く」保ち、複雑なロジックはドメインサービスや集約に委譲する
- アプリケーションサービスのメソッドは、ユースケースの流れが追いやすいように実装する

この考え方を意識しながら実装することで、ドメインの知識（「何を」と「なぜ」）とアプリケーションの流れ（「どのように」）を明確に分離できます。
