import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Company } from 'src/companies/schemas/company.schema';
import { Job } from 'src/jobs/schemas/job.schema';

export type UserResumeDocument = HydratedDocument<UserResume>;

@Schema({ timestamps: true })
export class UserResume {

    @Prop()
    userId: mongoose.Schema.Types.ObjectId;

    @Prop()
    jobTitle: string;

    @Prop()
    email: string;

    @Prop()
    lastName: string;

    @Prop()
    firstName: string;

    @Prop()
    address: string;

    @Prop()
    phone: string;

    @Prop()
    themeColor: string;

    @Prop()
    summary: string;

    @Prop({ type: mongoose.Schema.Types.Array })
    experience: {
        title: string;
        companyName: string;
        city: string;
        state: string;
        startDate: string;
        endDate: string;
        currentlyWorking: boolean;
        workSummary: string;
    }[];

    @Prop({ type: mongoose.Schema.Types.Array })
    education: {
        universityName: string;
        startDate: string;
        endDate: string;
        degree: string;
        major: string;
        description: string;
    }[];

    @Prop({ type: mongoose.Schema.Types.Array })
    skills: {
        name: string;
        rating: number
    }[];

    @Prop({ type: Object })
    createdBy: {
        _id: mongoose.Schema.Types.ObjectId;
        email: string
    };

    @Prop({ type: Object })
    updatedBy: {
        _id: mongoose.Schema.Types.ObjectId;
        email: string
    };

    @Prop({ type: Object })
    deletedBy: {
        _id: mongoose.Schema.Types.ObjectId;
        email: string
    };

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;

    @Prop()
    isDeleted: boolean;

    @Prop()
    deletedAt: Date;
}

export const UserResumeSchema = SchemaFactory.createForClass(UserResume);