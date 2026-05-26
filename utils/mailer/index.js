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
  secure: SECURE, // Relies on our config.js strict type-casting parser check
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

  /**
   * Core execution node for dispatching email payloads safely with try/catch insulation
   */
  async sendMail(to, subject, text, html) {
    try {
      const mailOptions = {
        from: FROM,
        to,
        subject,
        text,
        html,
      };
      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(`[Mail Delivery Failure] Destination: ${to} | Cause: ${error.message}`);
      throw new Error(`Email transportation pipeline failed: ${error.message}`);
    }
  }

  async sendProducerApprovalMail(to, producerName) {
    const html = producerApprovalTemplate(producerName);
    return await this.sendMail(to, "🎬 Welcome to Flixora! Account Approved", "", html);
  }

  async sendProducerRejectedMail(to, producerName) {
    const html = producerRejectedTemplate(producerName);
    return await this.sendMail(to, "Application Update · Flixora Producers Program", "", html);
  }

  async sendInfoNeededMail(to, producerName) {
    const html = infoNeededTemplate(producerName);
    return await this.sendMail(to, "Action Required: Additional Information Needed", "", html);
  }

  async sendFriendRecommendationMail(to, friendName, options = {}) {
    const html = friendRecommendationTemplate(friendName, options);
    return await this.sendMail(
      to, 
      `${options.senderName || "A friend"} recommended a movie for you on Flixora!`, 
      "", 
      html
    );
  }

  // FIXED: Expanded signature parameters payload mapping to cleanly pass the invitation metadata options forward
  async sendWatchalongMail(to, friendName, sessionOptions = {}) {
    const html = watchAlongTemplate(friendName, sessionOptions);
    return await this.sendMail(
      to, 
      `🍿 You're invited to a Watch Along session by ${sessionOptions.senderName || "a friend"}!`, 
      "", 
      html
    );
  }

  async sendSystemRecommendationMail(to, username, recommendationOptions = {}) {
    const html = systemRecommendationTemplate(username, recommendationOptions);
    return await this.sendMail(to, "Flixora Picks: Top Trending Originals For You", "", html);
  }
}

export const mailService = new MailService();