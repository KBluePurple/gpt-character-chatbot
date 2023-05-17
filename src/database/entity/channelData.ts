import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class ChannelData {
    @PrimaryGeneratedColumn()
    id: number;
    @Column("uuid")
    sessionId: string;
    @Column("varchar", {length: 32})
    channelName: string;
    @Column("varchar", {length: 32})
    guildName: string;
    @Column({type: "bigint", transformer: {from: (value: string) => BigInt(value), to: (value: bigint) => value.toString()} })
    guildId: string;
    @Column({type: "bigint", transformer: {from: (value: string) => BigInt(value), to: (value: bigint) => value.toString()} })
    channelId: string;
}