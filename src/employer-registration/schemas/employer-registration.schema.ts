import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type EmployerRegistrationDocument = HydratedDocument<EmployerRegistration>;

@Schema({ timestamps: true })
export class EmployerRegistration {

    @Prop()
    name: string;

    @Prop()
    position: string;

    @Prop()
    email: string;

    @Prop()
    phone: string;

    @Prop()
    address: string;

    @Prop()
    companyName: string;

    @Prop()
    companyAddress: string;

    @Prop()
    companyUrl: string;

    @Prop()
    status: string;

    @Prop({ type: Object })
    updatedBy: {
        _id: mongoose.Schema.Types.ObjectId;
        email: string
    };

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;
}

export const EmployerRegistrationSchema = SchemaFactory.createForClass(EmployerRegistration);