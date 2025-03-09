# システムパターン

## アーキテクチャ概要

このプロジェクトはオニオンアーキテクチャに準拠しており、以下の層で構成されています：

1. **ドメイン層**：ビジネスロジックの中核
2. **アプリケーション層**：ユースケースの実装
3. **インフラストラクチャ層**：外部システムとの連携
4. **プレゼンテーション層**：APIエンドポイントの提供

各層は内側の層にのみ依存し、外側の層への依存は持ちません。これにより、ドメインロジックを外部の技術的な詳細から分離し、テスト容易性と保守性を高めています。

## ドメインモデル設計

### 集約（Aggregate）

ドメインモデルは以下の2つの集約で構成されています：

#### 1. チーム集約（Team Aggregate）
- **集約ルート**: Team
- **エンティティ**: TeamMember（参加者情報）
- **値オブジェクト**: EmailAddress, EnrollmentStatus
- **責務**:
  - チーム情報の管理
  - チームメンバーの管理（追加・削除）
  - メンバーの在籍状態管理
  - チームサイズの制約適用

#### 2. 課題集約（Task Aggregate）
- **集約ルート**: Task
- **値オブジェクト**: ProgressStatus
- **責務**:
  - 課題の進捗管理
  - 進捗ステータスの遷移ルールの適用
  - 所有者確認のための参照

### 集約間の関係

```mermaid
classDiagram
    %% 値オブジェクト
    class EnrollmentStatus {
        <<ValueObject>>
        value: Enum
        canTransitionTo(newStatus)
    }
    
    class ProgressStatus {
        <<ValueObject>>
        value: Enum
        canTransitionTo(newStatus)
    }
    
    class EmailAddress {
        <<ValueObject>>
        value: String
        validate()
    }
    
    %% チーム集約
    class Team {
        <<AggregateRoot>>
        id: TeamId
        name: String
        members: TeamMember[]
        addMember(member)
        removeMember(memberId)
        changeMemberStatus(memberId, newStatus)
        validateTeamSize()
        validateNameUniqueness()
    }
    
    class TeamMember {
        <<Entity>>
        id: MemberId
        name: String
        email: EmailAddress
        status: EnrollmentStatus
        changeStatus(newStatus)
    }
    
    %% 課題集約
    class Task {
        <<AggregateRoot>>
        id: TaskId
        ownerId: MemberId
        progressStatus: ProgressStatus
        updateProgress(newStatus, requesterId)
        validateOwnership(requesterId)
    }
    
    %% リレーションシップ
    Team "1" *-- "2..4" TeamMember: contains
    TeamMember "1" -- "1" EmailAddress: has
    TeamMember "1" -- "1" EnrollmentStatus: has
    Task "1" -- "1" ProgressStatus: has
    Task "0..*" -- "1" TeamMember: owned by >
    
    %% ドメインサービス
    class TeamReorganizationService {
        <<DomainService>>
        mergeTeams(sourceTeam, targetTeam)
        splitTeam(oversizedTeam)
    }
```

## ドメインサービス

複雑なビジネスロジックを実装するために、最小限のドメインサービスを導入しています：

### チーム再編サービス（TeamReorganizationService）
- 複雑なチーム統合アルゴリズムの実装
- 複雑なチーム分割アルゴリズムの実装

これらは複雑なアルゴリズムを含むため、集約内に実装するよりもドメインサービスとして分離しています。

## ドメインイベント

集約間の疎結合な連携を実現するために、ドメインイベントを活用しています：

### チーム集約から発行されるイベント
- **TeamCreatedEvent**: チーム作成時
- **MemberAddedEvent**: メンバー追加時
- **MemberRemovedEvent**: メンバー削除時
- **MemberStatusChangedEvent**: メンバーの在籍状態変更時
- **TeamUndersizedEvent**: チームサイズが2名未満になった時
- **TeamOversizedEvent**: チームサイズが4名を超えた時

### 課題集約から発行されるイベント
- **TaskCreatedEvent**: 課題作成時
- **TaskProgressUpdatedEvent**: 課題進捗更新時
- **TaskCompletedEvent**: 課題完了時

### イベント処理フロー例

```mermaid
sequenceDiagram
    participant UC as ユースケース
    participant T as チーム集約
    participant E as イベントバス
    participant P as TeamReorganizationPolicy
    participant S as TeamReorganizationService
    
    UC->>T: changeMemberStatus(memberId, INACTIVE)
    T->>T: メンバーのステータス変更
    T->>T: メンバーの削除
    T->>E: MemberRemovedEvent発行
    T->>E: TeamUndersizedEvent発行
    E->>P: TeamUndersizedEvent通知
    P->>P: チームサイズ確認
    P->>S: mergeTeams(undersizedTeam, targetTeam)
    S->>S: チーム統合アルゴリズム実行
```

## アプリケーション層のポリシー

ドメインサービスを減らす代わりに、アプリケーション層にポリシーを導入しています：

### TeamReorganizationPolicy
- イベント購読：TeamUndersizedEvent, TeamOversizedEvent
- 責務：チームサイズの変更に応じたチーム再編処理の調整
- 主要処理：
  - チーム統合（1名のチームを他のチームに統合）
  - チーム分割（5名以上のチームを2つに分割）
  - 管理者への通知

### TaskManagementPolicy
- イベント購読：MemberStatusChangedEvent, MemberRemovedEvent
- 責務：参加者の状態変更に伴う課題の処理
- 主要処理：
  - 非アクティブになった参加者の課題の処理

## リポジトリパターン

各集約ルートに対応するリポジトリを定義し、永続化の詳細を抽象化しています：

1. **TeamRepository**: チームの永続化と検索
2. **TaskRepository**: 課題の永続化と検索

## 値オブジェクト

不変で値に基づく同一性を持つ値オブジェクトを活用しています：

1. **EmailAddress**: メールアドレスのバリデーションと値の保持
2. **EnrollmentStatus**: 在籍状態の値と遷移ルールの管理
3. **ProgressStatus**: 進捗状態の値と遷移ルールの管理

## 実装上の考慮点

1. **トランザクション管理**:
   - 集約内の一貫性はトランザクションで保証
   - 集約間の一貫性はイベント駆動で結果整合性を実現

2. **イベントの永続化**:
   - 重要なドメインイベントは監査目的で永続化
   - 障害発生時の再処理のための履歴保持

3. **非同期処理**:
   - メール通知などの副作用は非同期で実行
   - イベント処理の順序と整合性の確保

4. **集約間の参照**:
   - 集約間の参照はIDのみを使用
   - 必要に応じてリポジトリから関連する集約を取得
