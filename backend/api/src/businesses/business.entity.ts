import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('businesses')
export class Business {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ default: '' })
  category: string;

  @Column({ default: '' })
  categoryId: string;

  @Column('float', { default: 0 })
  rating: number;

  @Column('int', { default: 0 })
  reviews: number;

  @Column({ default: '' })
  distance: string;

  @Column('float')
  latitude: number;

  @Column('float')
  longitude: number;

  @Column({ default: '' })
  image: string;

  @Column({ default: false })
  verified: boolean;

  @Column('text', { default: '' })
  description: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  hours: string;

  @Column({ default: '' })
  address: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
