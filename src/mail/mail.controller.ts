import { Controller, Get } from '@nestjs/common';
import { MailService } from './mail.service';
import { Public, ResponseMessage } from 'src/auth/decorator/customize';
import { MailerService } from '@nestjs-modules/mailer';
import { name } from 'ejs';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { Subscriber, SubscriberDocument } from 'src/subscribers/schemas/subscriber.shema';
import { Job, JobDocument } from 'src/jobs/schemas/job.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { ApiTags } from '@nestjs/swagger';
import { url } from 'inspector';
import { ConfigService } from '@nestjs/config';
import { convertSlug } from './convert.config';

@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService,
    private mailerService: MailerService,
    private configService: ConfigService,

    @InjectModel(Subscriber.name)
    private subscriberModel: SoftDeleteModel<SubscriberDocument>,

    @InjectModel(Job.name)
    private jobModel: SoftDeleteModel<JobDocument>
  ) { }

  @Get()
  @Public()
  @ResponseMessage("Test email")
  // @Cron('0 10 0 * * 0') // 0.10" am every Sunday
  @Cron('*/15 * * * *') // Every 30 minutes
  async handleTestEmail() {
    const subscribers = await this.subscriberModel.find({});
    for (const subs of subscribers) {
      const subsSkills = subs.skills;
      const jobWithMatchingSkills = await this.jobModel.find({ skills: { $in: subsSkills } });
      if (jobWithMatchingSkills?.length) {
        const websiteUrl = this.configService.get<string>("FRONTEND_URL") || 'http://localhost:3000'
        const jobs = jobWithMatchingSkills.map(item => {
          const slug = convertSlug(item.name);
          const jobUrl = `${websiteUrl}/job/${slug}?id=${item._id}`
          return {
            name: item.name,
            company: item.company.name,
            salary: `${item.salary}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + " đ",
            skills: item.skills,
            jobUrl,
          }
        })

        console.log('subs.email :>> ', subs.email);

        await this.mailerService.sendMail({
          to: subs.email,
          from: '"JobHub Job Alerts" <jobhub@gmail.com>', // override default from
          subject: 'Khám phá job dành cho bạn nào!',
          template: "new-job",
          context: {
            receiver: subs.name,
            jobs: jobs,
            url: websiteUrl,
          }
        });

      }
    }
  }
}
