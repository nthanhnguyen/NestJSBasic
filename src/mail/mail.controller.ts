import { Controller, Get } from '@nestjs/common';
import { MailService } from './mail.service';
import { Public, ResponseMessage } from 'src/auth/decorator/customize';
import { MailerService } from '@nestjs-modules/mailer';
import { name } from 'ejs';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { Subscriber, SubscriberDocument } from 'src/subscribers/schemas/subscriber.shema';
import { Job, JobDocument } from 'src/jobs/schemas/job.schema';
import { InjectModel } from '@nestjs/mongoose';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService,
    private mailerService: MailerService,

    @InjectModel(Subscriber.name)
    private subscriberModel: SoftDeleteModel<SubscriberDocument>,

    @InjectModel(Job.name)
    private jobModel: SoftDeleteModel<JobDocument>
  ) { }

  @Get()
  @Public()
  @ResponseMessage("Test email")
  async handleTestEmail() {
    const jobs = [
      {
        name: "Backend NodeJS",
        company: "FPT",
        salary: "2000",
        skills: ["NodeJS", "MongoDB"]
      },
      {
        name: "Backend PHP",
        company: "VNG",
        salary: "3000",
        skills: ["PHP", "MongoDB"]
      }
    ]

    const subscribers = await this.subscriberModel.find({});
    for (const subs of subscribers) {
      const subsSkills = subs.skills;
      const jobWithMatchingSkills = await this.jobModel.find({ skills: { $in: subsSkills } });
      if (jobWithMatchingSkills?.length) {
        const jobs = jobWithMatchingSkills.map(item => {
          return {
            name: item.name,
            company: item.company.name,
            salary: `${item.salary}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + " đ",
            skills: item.skills
          }
        })

        await this.mailerService.sendMail({
          to: "ntnguyen10222002@gmail.com",
          from: '"Support Team" <support@example.com>', // override default from
          subject: 'Welcome to Nice App! Confirm your Email',
          template: "new-job", // HTML body content
          context: {
            receiver: subs.name,
            jobs: jobs
          }
        });

      }
    }


  }
}
