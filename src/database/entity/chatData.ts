import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class ChatData {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({type: "bigint", transformer: {from: (value: string) => BigInt(value), to: (value: bigint) => value.toString()} })
    messageId: string;
    @Column()
    time: Date;
    @Column("varchar", {length: 32})
    userName: string;
    @Column("varchar", {length: 32})
    userNick: string;
    @Column({type: "bigint", transformer: {from: (value: string) => BigInt(value), to: (value: bigint) => value.toString()} })
    userId: string;
    @Column("uuid")
    sessionId: string;
    @Column("varchar", {length: 2000})
    message: string;
}

@Entity()
export class EditedChatData {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({type: "bigint", transformer: {from: (value: string) => BigInt(value), to: (value: bigint) => value.toString()} })
    messageId: string;
    @Column()
    time: Date;
    @Column("varchar", {length: 32})
    userName: string;
    @Column("varchar", {length: 32})
    userNick: string;
    @Column({type: "bigint", transformer: {from: (value: string) => BigInt(value), to: (value: bigint) => value.toString()} })
    userId: string;
    @Column("uuid")
    sessionId: string;
    @Column("varchar", {length: 2000})
    message: string;
}

@Entity()
export class DeletedChatData {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({type: "bigint", transformer: {from: (value: string) => BigInt(value), to: (value: bigint) => value.toString()} })
    messageId: string;
    @Column()
    time: Date;
    @Column("varchar", {length: 32})
    userName: string;
    @Column("varchar", {length: 32})
    userNick: string;
    @Column({type: "bigint", transformer: {from: (value: string) => BigInt(value), to: (value: bigint) => value.toString()} })
    userId: string;
    @Column("uuid")
    sessionId: string;
    @Column("varchar", {length: 2000})
    message: string;
}