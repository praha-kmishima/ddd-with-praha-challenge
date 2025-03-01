<think>この質問では、DDDにおけるドメインモデルをTypeScriptで実装するイメージを作成するよう依頼されています。ドメインモデル図_4集約バージョンと仕様.mdを参考にして、ドメインモデル、リポジトリ層、アプリケーション層の実装例を提供する必要があります。

まずは4つの集約とそれに含まれるエンティティ、値オブジェクトを整理し、それぞれの実装イメージを作成しましょう。

ドメインモデル図_4集約バージョンによると、以下の集約があります：
1. 参加者集約（Participant Aggregate）
2. 課題集約（Task Aggregate）
3. チーム集約（Team Aggregate）
4. チームメンバーシップ集約（TeamMembership Aggregate）

次に、それぞれの値オブジェクト：
- EnrollmentStatus（在籍ステータス）
- ProgressStatus（進捗ステータス）
- EmailAddress（メールアドレス）

仕様から、これらのエンティティや値オブジェクトが持つべき属性と振る舞いを抽出し、TypeScriptでのクラスやインターフェース定義を作成します。

また、リポジトリ層とアプリケーション層（ユースケース層）の実装例も提供し、それぞれの責務を明確にしたいと思います。</think># TypeScriptによるドメインモデル実装イメージ

## 目次
1. [ドメインモデル](#1-ドメインモデル)
   - [値オブジェクト](#11-値オブジェクト)
   - [エンティティと集約](#12-エンティティと集約)
2. [リポジトリ層](#2-リポジトリ層)
3. [ドメインサービス](#3-ドメインサービス)
4. [アプリケーション層](#4-アプリケーション層)
5. [ディレクトリ構成](#5-ディレクトリ構成)

## 1. ドメインモデル

### 1.1 値オブジェクト

```typescript:src/domain/models/shared/valueObjects/EmailAddress.ts
export class EmailAddress {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): EmailAddress {
    if (!this.isValidEmail(value)) {
      throw new Error('無効なメールアドレス形式です');
    }
    return new EmailAddress(value);
  }

  private static isValidEmail(email: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  }

  equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
```

```typescript:src/domain/models/participant/valueObjects/EnrollmentStatus.ts
export enum EnrollmentStatusValue {
  ACTIVE = 'ACTIVE',   // 在籍中
  INACTIVE = 'INACTIVE', // 休会中
  WITHDRAWN = 'WITHDRAWN' // 退会済
}

export class EnrollmentStatus {
  private readonly value: EnrollmentStatusValue;

  private constructor(value: EnrollmentStatusValue) {
    this.value = value;
  }

  static create(value: EnrollmentStatusValue): EnrollmentStatus {
    return new EnrollmentStatus(value);
  }

  static active(): EnrollmentStatus {
    return new EnrollmentStatus(EnrollmentStatusValue.ACTIVE);
  }

  static inactive(): EnrollmentStatus {
    return new EnrollmentStatus(EnrollmentStatusValue.INACTIVE);
  }

  static withdrawn(): EnrollmentStatus {
    return new EnrollmentStatus(EnrollmentStatusValue.WITHDRAWN);
  }

  canTransitionTo(newStatus: EnrollmentStatus): boolean {
    // すべての遷移を許可（仕様になし）
    return true;
  }

  equals(other: EnrollmentStatus): boolean {
    return this.value === other.value;
  }

  isActive(): boolean {
    return this.value === EnrollmentStatusValue.ACTIVE;
  }

  isInactive(): boolean {
    return this.value === EnrollmentStatusValue.INACTIVE;
  }

  isWithdrawn(): boolean {
    return this.value === EnrollmentStatusValue.WITHDRAWN;
  }

  toString(): string {
    return this.value;
  }
}
```

```typescript:src/domain/models/task/valueObjects/ProgressStatus.ts
export enum ProgressStatusValue {
  NOT_STARTED = 'NOT_STARTED',   // 未着手
  IN_PROGRESS = 'IN_PROGRESS',   // 取組中
  AWAITING_REVIEW = 'AWAITING_REVIEW', // レビュー待ち
  COMPLETED = 'COMPLETED'        // 完了
}

export class ProgressStatus {
  private readonly value: ProgressStatusValue;

  private constructor(value: ProgressStatusValue) {
    this.value = value;
  }

  static create(value: ProgressStatusValue): ProgressStatus {
    return new ProgressStatus(value);
  }

  static notStarted(): ProgressStatus {
    return new ProgressStatus(ProgressStatusValue.NOT_STARTED);
  }

  static inProgress(): ProgressStatus {
    return new ProgressStatus(ProgressStatusValue.IN_PROGRESS);
  }

  static awaitingReview(): ProgressStatus {
    return new ProgressStatus(ProgressStatusValue.AWAITING_REVIEW);
  }

  static completed(): ProgressStatus {
    return new ProgressStatus(ProgressStatusValue.COMPLETED);
  }

  canTransitionTo(newStatus: ProgressStatus): boolean {
    // 遷移ルールに基づいて判定
    const current = this.value;
    const next = newStatus.value;

    if (current === ProgressStatusValue.NOT_STARTED) {
      return next === ProgressStatusValue.IN_PROGRESS;
    }
    
    if (current === ProgressStatusValue.IN_PROGRESS) {
      return next === ProgressStatusValue.AWAITING_REVIEW;
    }
    
    if (current === ProgressStatusValue.AWAITING_REVIEW) {
      return next === ProgressStatusValue.IN_PROGRESS || 
             next === ProgressStatusValue.COMPLETED;
    }
    
    if (current === ProgressStatusValue.COMPLETED) {
      return false; // 完了状態からは変更不可
    }

    return false;
  }

  equals(other: ProgressStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
```

```typescript:src/domain/models/shared/Entity.ts
// エンティティの基底クラス
export abstract class Entity<T> {
  protected readonly _id: T;
  
  constructor(id: T) {
    this._id = id;
  }
  
  get id(): T {
    return this._id;
  }
  
  equals(entity: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }
    if (!(entity instanceof Entity)) {
      return false;
    }
    return this._id === entity._id;
  }
}
```

### 1.2 エンティティと集約

```typescript:src/domain/models/participant/Participant.ts
import { Entity } from '../shared/Entity';
import { EmailAddress } from '../shared/valueObjects/EmailAddress';
import { EnrollmentStatus } from './valueObjects/EnrollmentStatus';

export type ParticipantId = string;

export class Participant extends Entity<ParticipantId> {
  private _name: string;
  private _email: EmailAddress;
  private _status: EnrollmentStatus;

  private constructor(
    id: ParticipantId,
    name: string,
    email: EmailAddress,
    status: EnrollmentStatus
  ) {
    super(id);
    this._name = name;
    this._email = email;
    this._status = status;
  }

  static create(
    id: ParticipantId, 
    name: string, 
    email: EmailAddress
  ): Participant {
    return new Participant(
      id, 
      name, 
      email, 
      EnrollmentStatus.active()
    );
  }

  get name(): string {
    return this._name;
  }

  get email(): EmailAddress {
    return this._email;
  }

  get status(): EnrollmentStatus {
    return this._status;
  }

  changeStatus(newStatus: EnrollmentStatus): void {
    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error('無効なステータス遷移です');
    }
    this._status = newStatus;
  }

  canJoinTeam(): boolean {
    // 在籍中の参加者のみチームに参加可能
    return this._status.isActive();
  }

  rename(newName: string): void {
    this._name = newName;
  }

  // 値オブジェクト更新のため完全な新オブジェクトの作成が必要
  changeEmail(newEmail: EmailAddress): void {
    this._email = newEmail;
  }
}
```

```typescript:src/domain/models/task/Task.ts
import { Entity } from '../shared/Entity';
import { ParticipantId } from '../participant/Participant';
import { ProgressStatus } from './valueObjects/ProgressStatus';

export type TaskId = string;

export class Task extends Entity<TaskId> {
  private _title: string;
  private _ownerId: ParticipantId;
  private _progressStatus: ProgressStatus;

  private constructor(
    id: TaskId,
    title: string,
    ownerId: ParticipantId,
    progressStatus: ProgressStatus
  ) {
    super(id);
    this._title = title;
    this._ownerId = ownerId;
    this._progressStatus = progressStatus;
  }

  static create(
    id: TaskId, 
    title: string, 
    ownerId: ParticipantId
  ): Task {
    return new Task(
      id, 
      title, 
      ownerId, 
      ProgressStatus.notStarted()
    );
  }

  get title(): string {
    return this._title;
  }

  get ownerId(): ParticipantId {
    return this._ownerId;
  }

  get progressStatus(): ProgressStatus {
    return this._progressStatus;
  }

  updateProgress(newStatus: ProgressStatus, requesterId: ParticipantId): void {
    // 所有者チェック
    this.validateOwnership(requesterId);
    
    // 状態遷移チェック
    if (!this._progressStatus.canTransitionTo(newStatus)) {
      throw new Error(`進捗ステータスを ${this._progressStatus} から ${newStatus} に変更できません`);
    }
    
    this._progressStatus = newStatus;
  }

  validateOwnership(requesterId: ParticipantId): void {
    if (this._ownerId !== requesterId) {
      throw new Error('課題の所有者のみが進捗を更新できます');
    }
  }

  rename(newTitle: string): void {
    this._title = newTitle;
  }
}
```

```typescript:src/domain/models/team/Team.ts
import { Entity } from '../shared/Entity';
import { ParticipantId } from '../participant/Participant';

export type TeamId = string;

export class Team extends Entity<TeamId> {
  private _name: string;
  private _members: ParticipantId[];

  private constructor(
    id: TeamId,
    name: string,
    members: ParticipantId[] = []
  ) {
    super(id);
    this._name = name;
    this._members = members;
  }

  static create(id: TeamId, name: string): Team {
    this.validateTeamName(name);
    return new Team(id, name);
  }

  private static validateTeamName(name: string): void {
    // チーム名は英小文字1文字でなければならない
    if (!/^[a-z]$/.test(name)) {
      throw new Error('チーム名は英小文字1文字でなければなりません');
    }
  }

  get name(): string {
    return this._name;
  }

  get members(): readonly ParticipantId[] {
    // 配列の不変性を保つために新しい配列を返す
    return [...this._members];
  }

  getMemberCount(): number {
    return this._members.length;
  }

  addMember(participantId: ParticipantId): void {
    // チームサイズの制約をチェック
    if (this._members.length >= 4) {
      throw new Error('チームの最大人数は4名です');
    }
    
    // 既に所属しているかチェック
    if (this._members.includes(participantId)) {
      throw new Error('参加者は既にチームに所属しています');
    }
    
    this._members.push(participantId);
  }

  removeMember(participantId: ParticipantId): void {
    const index = this._members.indexOf(participantId);
    if (index === -1) {
      throw new Error('指定された参加者はチームに所属していません');
    }
    
    this._members.splice(index, 1);
  }

  canAcceptMember(): boolean {
    return this._members.length < 4;
  }

  hasMember(participantId: ParticipantId): boolean {
    return this._members.includes(participantId);
  }

  isBelowMinimumSize(): boolean {
    return this._members.length < 2;
  }

  isEmpty(): boolean {
    return this._members.length === 0;
  }

  rename(newName: string): void {
    Team.validateTeamName(newName);
    this._name = newName;
  }
}
```

```typescript:src/domain/models/teamMembership/TeamMembership.ts
import { Entity } from '../shared/Entity';
import { ParticipantId } from '../participant/Participant';
import { TeamId } from '../team/Team';

export type TeamMembershipId = string;

export class TeamMembership extends Entity<TeamMembershipId> {
  private _participantId: ParticipantId;
  private _teamId: TeamId;
  private _joinedAt: Date;

  private constructor(
    id: TeamMembershipId,
    participantId: ParticipantId,
    teamId: TeamId,
    joinedAt: Date
  ) {
    super(id);
    this._participantId = participantId;
    this._teamId = teamId;
    this._joinedAt = joinedAt;
  }

  static create(
    id: TeamMembershipId, 
    participantId: ParticipantId, 
    teamId: TeamId
  ): TeamMembership {
    return new TeamMembership(
      id, 
      participantId, 
      teamId, 
      new Date()
    );
  }

  get participantId(): ParticipantId {
    return this._participantId;
  }

  get teamId(): TeamId {
    return this._teamId;
  }

  get joinedAt(): Date {
    return new Date(this._joinedAt.getTime());
  }

  changeTeam(newTeamId: TeamId): void {
    this._teamId = newTeamId;
    // 移動したので参加日時を更新
    this._joinedAt = new Date();
  }
}
```

## 2. リポジトリ層

```typescript:src/domain/repositories/ParticipantRepository.ts
import { Participant, ParticipantId } from '../models/participant/Participant';
import { EmailAddress } from '../models/shared/valueObjects/EmailAddress';

export interface ParticipantRepository {
  save(participant: Participant): Promise<void>;
  findById(id: ParticipantId): Promise<Participant | null>;
  findByEmail(email: EmailAddress): Promise<Participant | null>;
  findAll(): Promise<Participant[]>;
  delete(id: ParticipantId): Promise<void>;
}
```

```typescript:src/domain/repositories/TaskRepository.ts
import { Task, TaskId } from '../models/task/Task';
import { ParticipantId } from '../models/participant/Participant';

export interface TaskRepository {
  save(task: Task): Promise<void>;
  findById(id: TaskId): Promise<Task | null>;
  findByOwnerId(ownerId: ParticipantId): Promise<Task[]>;
  findAll(): Promise<Task[]>;
  delete(id: TaskId): Promise<void>;
}
```

```typescript:src/domain/repositories/TeamRepository.ts
import { Team, TeamId } from '../models/team/Team';
import { ParticipantId } from '../models/participant/Participant';

export interface TeamRepository {
  save(team: Team): Promise<void>;
  findById(id: TeamId): Promise<Team | null>;
  findByName(name: string): Promise<Team | null>;
  findByMemberId(memberId: ParticipantId): Promise<Team | null>;
  findSmallestTeam(): Promise<Team | null>;
  findAll(): Promise<Team[]>;
  delete(id: TeamId): Promise<void>;
}
```

```typescript:src/domain/repositories/TeamMembershipRepository.ts
import { TeamMembership, TeamMembershipId } from '../models/teamMembership/TeamMembership';
import { ParticipantId } from '../models/participant/Participant';
import { TeamId } from '../models/team/Team';

export interface TeamMembershipRepository {
  save(teamMembership: TeamMembership): Promise<void>;
  findById(id: TeamMembershipId): Promise<TeamMembership | null>;
  findByParticipantId(participantId: ParticipantId): Promise<TeamMembership | null>;
  findByTeamId(teamId: TeamId): Promise<TeamMembership[]>;
  delete(id: TeamMembershipId): Promise<void>;
  deleteByParticipantId(participantId: ParticipantId): Promise<void>;
  deleteByTeamId(teamId: TeamId): Promise<void>;
}
```

## 3. ドメインサービス

```typescript:src/domain/services/TeamReorganizationService.ts
import { ParticipantId } from '../models/participant/Participant';
import { Team, TeamId } from '../models/team/Team';
import { TeamRepository } from '../repositories/TeamRepository';
import { TeamMembershipRepository } from '../repositories/TeamMembershipRepository';
import { TeamMembership, TeamMembershipId } from '../models/teamMembership/TeamMembership';

export class TeamReorganizationService {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly teamMembershipRepository: TeamMembershipRepository
  ) {}

  // チームサイズが1になったときの処理
  async handleTeamUnderflow(team: Team, leavingParticipantId: ParticipantId): Promise<Team | null> {
    // チームに残っている人数を確認
    if (team.getMemberCount() > 1) {
      // 2人以上なら処理不要
      return team;
    }

    // チームが空の場合
    if (team.isEmpty()) {
      // チームを削除して終了
      await this.teamRepository.delete(team.id);
      return null;
    }

    // 1人だけ残っている場合、その参加者を他のチームに合流させる
    const remainingParticipantId = team.members[0];
    
    // 最も人数の少ないチームを探す（現在のチームを除く）
    const allTeams = await this.teamRepository.findAll();
    const availableTeams = allTeams
      .filter(t => t.id !== team.id)  // 現在のチームを除外
      .filter(t => t.canAcceptMember());  // 参加可能なチームのみ
    
    if (availableTeams.length === 0) {
      // 合流先がない場合はnullを返す
      return null;
    }
    
    // 最も人数の少ないチームを選ぶ
    const targetTeam = availableTeams.reduce((smallest, current) => 
      current.getMemberCount() < smallest.getMemberCount() ? current : smallest,
      availableTeams[0]
    );
    
    // 参加者を新しいチームに追加
    targetTeam.addMember(remainingParticipantId);
    await this.teamRepository.save(targetTeam);
    
    // メンバーシップを更新
    const membership = await this.teamMembershipRepository.findByParticipantId(remainingParticipantId);
    if (membership) {
      membership.changeTeam(targetTeam.id);
      await this.teamMembershipRepository.save(membership);
    } else {
      // メンバーシップが存在しない場合は新規作成
      const newMembership = TeamMembership.create(
        crypto.randomUUID() as TeamMembershipId,
        remainingParticipantId,
        targetTeam.id
      );
      await this.teamMembershipRepository.save(newMembership);
    }
    
    // 元のチームを削除
    await this.teamRepository.delete(team.id);
    
    return targetTeam;
  }

  // チームが5人になる場合の分割処理
  async splitTeam(team: Team, newParticipantId: ParticipantId): Promise<[Team, Team]> {
    if (team.getMemberCount() < 4) {
      throw new Error('チームの人数が5名未満の場合は分割できません');
    }
    
    // 現在のメンバー + 新しいメンバー
    const allMembers = [...team.members, newParticipantId];
    
    // ランダムに2グループに分ける
    const shuffledMembers = this.shuffleArray([...allMembers]);
    const midpoint = Math.floor(shuffledMembers.length / 2);
    
    const group1Members = shuffledMembers.slice(0, midpoint);
    const group2Members = shuffledMembers.slice(midpoint);
    
    // 元のチームを更新
    const updatedTeam = Team.create(team.id, team.name);
    for (const memberId of group1Members) {
      updatedTeam.addMember(memberId);
    }
    
    // 新しいチームを作成
    // 新チーム名の生成ロジック（実際には別の命名規則があるかもしれません）
    const existingTeams = await this.teamRepository.findAll();
    const existingNames = new Set(existingTeams.map(t => t.name));
    
    // a-zの中から使われていない名前を探す
    let newTeamName = '';
    for (let charCode = 97; charCode <= 122; charCode++) {
      const name = String.fromCharCode(charCode);
      if (!existingNames.has(name)) {
        newTeamName = name;
        break;
      }
    }
    
    if (!newTeamName) {
      throw new Error('利用可能なチーム名がありません');
    }
    
    const newTeam = Team.create(
      crypto.randomUUID() as TeamId,
      newTeamName
    );
    
    for (const memberId of group2Members) {
      newTeam.addMember(memberId);
    }
    
    // チームを保存
    await this.teamRepository.save(updatedTeam);
    await this.teamRepository.save(newTeam);
    
    // メンバーシップを更新
    for (const memberId of group1Members) {
      const membership = await this.teamMembershipRepository.findByParticipantId(memberId);
      if (membership && membership.teamId !== updatedTeam.id) {
        membership.changeTeam(updatedTeam.id);
        await this.teamMembershipRepository.save(membership);
      } else if (!membership) {
        const newMembership = TeamMembership.create(
          crypto.randomUUID() as TeamMembershipId,
          memberId,
          updatedTeam.id
        );
        await this.teamMembershipRepository.save(newMembership);
      }
    }
    
    for (const memberId of group2Members) {
      const membership = await this.teamMembershipRepository.findByParticipantId(memberId);
      if (membership) {
        membership.changeTeam(newTeam.id);
        await this.teamMembershipRepository.save(membership);
      } else {
        const newMembership = TeamMembership.create(
          crypto.randomUUID() as TeamMembershipId,
          memberId,
          newTeam.id
        );
        await this.teamMembershipRepository.save(newMembership);
      }
    }
    
    return [updatedTeam, newTeam];
  }

  // 最も小さいチームを見つける
  async findSmallestTeam(): Promise<Team | null> {
    const teams = await this.teamRepository.findAll();
    if (teams.length === 0) {
      return null;
    }
    
    return teams.reduce((smallest, current) => 
      current.getMemberCount() < smallest.getMemberCount() ? current : smallest,
      teams[0]
    );
  }

  // 配列をシャッフル
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
```

```typescript:src/domain/services/ParticipantStatusChangeService.ts
import { Participant, ParticipantId } from '../models/participant/Participant';
import { EnrollmentStatus } from '../models/participant/valueObjects/EnrollmentStatus';
import { ParticipantRepository } from '../repositories/ParticipantRepository';
import { TeamRepository } from '../repositories/TeamRepository';
import { TeamMembershipRepository } from '../repositories/TeamMembershipRepository';

export class ParticipantStatusChangeService {
  constructor(
    private readonly participantRepository: ParticipantRepository,
    private readonly teamRepository: TeamRepository,
    private readonly teamMembershipRepository: TeamMembershipRepository
  ) {}

  async validateStatusChange(
    participant: Participant, 
    newStatus: EnrollmentStatus
  ): Promise<void> {
    // 状態遷移の検証
    if (!participant.status.canTransitionTo(newStatus)) {
      throw new Error(`在籍ステータスを ${participant.status} から ${newStatus} に変更できません`);
    }
    
    // 在籍中→非在籍への変更の場合、チーム所属の確認
    if (participant.status.isActive() && !newStatus.isActive()) {
      // チーム所属の確認はリポジトリを使用
      const membership = await this.teamMembershipRepository.findByParticipantId(participant.id);
      if (membership) {
        // チームからの離脱処理はアプリケーションサービスで行うので
        // ここではチェックのみ
        return;
      }
    }
  }

  // 特定の参加者が所属するチームを取得
  async getTeamByParticipantId(participantId: ParticipantId): Promise<Team | null> {
    return this.teamRepository.findByMemberId(participantId);
  }
}
```

## 4. アプリケーション層

```typescript:src/application/ParticipantStatusChangeUseCase.ts
import { ParticipantId } from '../domain/models/participant/Participant';
import { EnrollmentStatus, EnrollmentStatusValue } from '../domain/models/participant/valueObjects/EnrollmentStatus';
import { ParticipantRepository } from '../domain/repositories/ParticipantRepository';
import { TeamRepository } from '../domain/repositories/TeamRepository';
import { TeamMembershipRepository } from '../domain/repositories/TeamMembershipRepository';
import { ParticipantStatusChangeService } from '../domain/services/ParticipantStatusChangeService';
import { TeamReorganizationService } from '../domain/services/TeamReorganizationService';
import { NotificationService } from '../domain/services/NotificationService';

export class ParticipantStatusChangeUseCase {
  constructor(
    private readonly participantRepository: ParticipantRepository,
    private readonly teamRepository: TeamRepository,
    private readonly teamMembershipRepository: TeamMembershipRepository,
    private readonly participantStatusChangeService: ParticipantStatusChangeService,
    private readonly teamReorganizationService: TeamReorganizationService,
    private readonly notificationService: NotificationService
  ) {}

  async execute(
    participantId: ParticipantId, 
    newStatusValue: EnrollmentStatusValue
  ): Promise<void> {
    // 参加者の取得
    const participant = await this.participantRepository.findById(participantId);
    if (!participant) {
      throw new Error('参加者が見つかりません');
    }

    // 新しいステータスの作成
    const newStatus = EnrollmentStatus.create(newStatusValue);
    
    // 変更前のステータス保存
    const oldStatus = participant.status;
    
    // ドメインサービスでステータス変更の検証
    await this.participantStatusChangeService.validateStatusChange(participant, newStatus);
    
    // ステータス変更の実行
    participant.changeStatus(newStatus);
    
    // 在籍中→非在籍の場合
    if (oldStatus.isActive() && !newStatus.isActive()) {
      // チームからの離脱処理
      const team = await this.teamRepository.findByMemberId(participantId);
      if (team) {
        // 参加者離脱前のチーム人数を保存
        const originalMemberCount = team.getMemberCount();
        
        // チームからメンバーを削除
        team.removeMember(participantId);
        
        // メンバーシップの削除
        await this.teamMembershipRepository.deleteByParticipantId(participantId);
        
        // チーム人数が2名以下になった場合
        if (originalMemberCount > 2 && team.getMemberCount() <= 2 && team.getMemberCount() > 0) {
          // 管理者に通知
          await this.notificationService.notifyAdminAboutUnderflowTeam(team, participant);
        }
        
        // チーム人数が1名になった場合
        if (team.getMemberCount() === 1) {
          // チーム再編成サービスで合流処理
          const targetTeam = await this.teamReorganizationService.handleTeamUnderflow(team, participantId);
          
          if (!targetTeam) {
            // 合流先がない場合は管理者に通知
            const remainingParticipantId = team.members[0];
            const remainingParticipant = await this.participantRepository.findById(remainingParticipantId);
            if (remainingParticipant) {
              await this.notificationService.notifyAdminAboutNoMergeTarget(remainingParticipant, participant);
            }
          }
        } else {
          // チームを保存
          await this.teamRepository.save(team);
        }
      }
    }
    
    // 非在籍→在籍中の場合
    if (!oldStatus.isActive() && newStatus.isActive()) {
      // 最も小さいチームを探して配属
      const targetTeam = await this.teamReorganizationService.findSmallestTeam();
      
      if (targetTeam) {
        if (targetTeam.getMemberCount() === 4) {
          // 5人になる場合はチーム分割
          await this.teamReorganizationService.splitTeam(targetTeam, participantId);
        } else {
          // 通常の追加
          targetTeam.addMember(participantId);
          await this.teamRepository.save(targetTeam);
          
          // メンバーシップ作成
          const teamMembership = TeamMembership.create(
            crypto.randomUUID() as TeamMembershipId,
            participantId,
            targetTeam.id
          );
          await this.teamMembershipRepository.save(teamMembership);
        }
      } else {
        // チームがない場合は新規作成
        // 実装省略（新しいチーム名の生成などが必要）
      }
    }
    
    // 参加者を保存
    await this.participantRepository.save(participant);
  }
}
```

```typescript:src/application/UpdateTaskProgressUseCase.ts
import { TaskId } from '../domain/models/task/Task';
import { ParticipantId } from '../domain/models/participant/Participant';
import { ProgressStatus, ProgressStatusValue } from '../domain/models/task/valueObjects/ProgressStatus';
import { TaskRepository } from '../domain/repositories/TaskRepository';

export class UpdateTaskProgressUseCase {
  constructor(
    private readonly taskRepository: TaskRepository
  ) {}

  async execute(
    taskId: TaskId, 
    requesterId: ParticipantId,
    newStatusValue: ProgressStatusValue
  ): Promise<void> {
    // 課題の取得
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new Error('課題が見つかりません');
    }

    // 新しいステータスの作成
    const newStatus = ProgressStatus.create(newStatusValue);
    
    // ステータス更新の実行（内部で所有者チェックと状態遷移チェックを行う）
    task.updateProgress(newStatus, requesterId);
    
    // 課題を保存
    await this.taskRepository.save(task);
  }
}
```

## 5. ディレクトリ構成

```
src/
├── domain/
│   ├── models/
│   │   ├── shared/
│   │   │   ├── Entity.ts
│   │   │   └── valueObjects/
│   │   │       └── EmailAddress.ts
│   │   ├── participant/
│   │   │   ├── Participant.ts
│   │   │   └── valueObjects/
│   │   │       └── EnrollmentStatus.ts
│   │   ├── task/
│   │   │   ├── Task.ts
│   │   │   └── valueObjects/
│   │   │       └── ProgressStatus.ts
│   │   ├── team/
│   │   │   └── Team.ts
│   │   └── teamMembership/
│   │       └── TeamMembership.ts
│   ├── repositories/
│   │   ├── ParticipantRepository.ts
│   │   ├── TaskRepository.ts
│   │   ├── TeamRepository.ts
│   │   └── TeamMembershipRepository.ts
│   └── services/
│       ├── ParticipantStatusChangeService.ts
│       ├── TeamReorganizationService.ts
│       └── NotificationService.ts
├── application/
│   ├── ParticipantStatusChangeUseCase.ts
│   ├── UpdateTaskProgressUseCase.ts
│   └── AssignParticipantToTeamUseCase.ts
└── infrastructure/
    ├── repositories/
    │   ├── DrizzleParticipantRepository.ts
    │   ├── DrizzleTaskRepository.ts
    │   ├── DrizzleTeamRepository.ts
    │   └── DrizzleTeamMembershipRepository.ts
    └── services/
        └── EmailNotificationService.ts
```

このドキュメントは、DDDに基づいたTypeScriptでのドメインモデル実装イメージを提供しています。実際の実装では、エラーハンドリングやバリデーション、詳細な実装などさらに考慮する必要があるでしょう。
