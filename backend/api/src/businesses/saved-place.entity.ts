import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('saved_places')
export class SavedPlace {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  businessId: string;

  @CreateDateColumn()
  savedAt: Date;
}
