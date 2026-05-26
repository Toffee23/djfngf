import nodemailer from "nodemailer";
import { configs } from "./config.js";

import {
  producerApprovalTemplate,
  producerRejectedTemplate,
  infoNeededTemplate,
} from "./templates/producer.template.js";

import {
  watchAlongTemplate,
  friendRecommendationTemplate,
  systemRecommendationTemplate,
} from "./templates/user.template.js";

const { FROM, PASSWORD, PORT, SECURE, HOST } = configs;

const configOptions = {
  host: HOST,
  port: Number(PORT),
  secure: SECURE === true || SECURE === "true",
  auth: {
    user: FROM,
    pass: PASSWORD,
  },
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
};

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport(configOptions);
  }

  async sendMail(to, subject, text, html) {
    const mailOptions = {
      from: FROM,
      to,
      subject,
      text,
      html,
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendProducerApprovalMail(to, producerName) {
    const html = producerApprovalTemplate(producerName);

    return await this.sendMail(to, "Producer Approval", "", html);
  }

  async sendProducerRejectedMail(to, producerName) {
    const html = producerRejectedTemplate(producerName);

    return await this.sendMail(to, "Producer Rejected", "", html);
  }

  async sendInfoNeededMail(to, producerName) {
    const html = infoNeededTemplate(producerName);

    return await this.sendMail(to, "Additional Information Needed", "", html);
  }

  async sendFriendRecommendationMail(
    to,
    friendName,
    { movieTitle, movieUrl, senderName } = {},
  ) {
    const html = friendRecommendationTemplate(friendName, {
      movieTitle,
      movieUrl,
      senderName,
    });

    return await this.sendMail(to, "Friend Recommendation", "", html);
  }

  async sendWatchalongMail(to, friendName) {
    const html = watchAlongTemplate(friendName);

    return await this.sendMail(to, "Flixora Watchalong Invitation", "", html);
  }

  async sendSystemRecommendationMail(to, user_name) {
    const html = systemRecommendationTemplate(user_name);

    return await this.sendMail(to, "Recommended For You", "", html);
  }
}

export const mailService = new MailService();
