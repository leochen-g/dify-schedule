import nodemailer from "nodemailer";
import env from "./env.js";
import pkg from "../package.json" assert { type: "json" };

export class Notify {
  /**
   * 邮件推送
   * @param options
   */
  async email(options) {
    const auth = {
      user: env.EMAIL_USER, // generated ethereal user
      pass: env.EMAIL_PASS, // generated ethereal password
    };

    if (!auth.user || !auth.pass || auth.user === "" || auth.pass === "") {
      throw new Error("未配置邮箱。");
    }

    const transporter = nodemailer.createTransport({
      host: "smtp." + auth.user.match(/@(.*)/)[1],
      secure: true,
      port: 465,
      auth,
      tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false,
      },
    });

    const template = `
<style>
  .dify-header {
    padding: 10px 0;
    border-bottom: 1px solid #f1f1f1;
    text-align: center;
  }
  .dify-header img {
    width: auto;
    height: 40px;
    object-fit: contain;
    vertical-align: middle;
  }
  .dify-update-tip {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    font-size: 12px;
    background: #fff4e5;
    color: #663c00;
    text-decoration: none;
  }
  .dify-main {
    padding: 10px;
  }
  .dify-footer {
    padding: 10px 0;
    border-top: 1px solid #f1f1f1;
    text-align: center;
    font-size: 12px;
    color: #6e6e73;
  }
</style>
<section>
  <header class="dify-header">
    <img src="cid:logo-site.png" width="120" height="24" alt="dify" />
  </header>
  ${
    this.newVersion.has
      ? `<a class="dify-update-tip" href="${this.newVersion.url}" target="_blank"><span>Dify工作流定时助手 ${this.newVersion.name} 现在可用 ›</span></a>`
      : ""
  }
  <main class="dify-main">
    ${
      options.msgtype === "html"
        ? options.content
        : `<pre style="margin: 0;">${options.content}</pre>`
    }
  </main>
  <footer class="dify-footer">
    <span>Dify工作流定时助手v${pkg.version}</span> |
    <span>Copyright © ${new Date().getFullYear()} <a href="https://github.com/leochen-g" target="_blank">Leo_chen</a></span>
  </footer>
</section>
`.trim();

    await transporter.sendMail({
      from: `Dify工作流定时助手 <${auth.user}>`, // sender address（'"Fred Foo 👻" <foo@example.com>'）
      to: env.EMAIL_TO, // list of receivers
      subject: options.title, // Subject line
      // text, // plain text body
      html: template, // html body
      attachments: [
        {
          filename: "logo.svg",
          path: 'https://cloud.dify.ai/logo/logo-site.png',
          cid: "logo-site.png", //same cid value as in the html img src
        },
      ],
    });
  }

  /**
   * PushPlus推送
   * @param options
   */
  async pushplus(options) {
    const token = env.PUSHPLUS_TOKEN;
    if (!token || token === "") {
      throw new Error("未配置PushPlus Token。");
    }

    const config = {
      token,
      title: options.title,
      content: options.content,
      topic: "",
      template: "html",
      channel: "wechat",
      webhook: "",
      callbackUrl: "",
      timestamp: "",
    };

    const response = await fetch("http://www.pushplus.plus/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });
    return response;
  }

  /**
   * serverPush推送
   * @param options
   */
  async serverPush(options) {
    const token = env.SERVERPUSHKEY;
    if (!token || token === "") {
      throw new Error("未配置Server酱 key。");
    }

    const config = {
      title: options.title,
      desp: options.content,
      channel: "9",
    };

    const response = await fetch(`https://sctapi.ftqq.com/${token}.send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });
    return response;
  }

  /**
   * 钉钉Webhook
   * @param options
   */
  async dingtalkWebhook(options) {
    const url = env.DINGDING_WEBHOOK;
    if (!url || url === "") {
      throw new Error("未配置钉钉Webhook。");
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        msgtype: "text",
        text: {
          content: `${options.content}`,
        },
      }),
    });
    return response;
  }

  /**
   * 飞书Webhook
   * @param options
   */
  async feishuWebhook(options) {
    const url = env.FEISHU_WEBHOOK;
    if (!url || url === "") {
      throw new Error("未配置飞书Webhook。");
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        msg_type: "interactive",
        card: {
          elements: [
            {
              tag: "markdown",
              content: options.content,
              text_align: "left",
            },
          ],
          header: {
            template: "blue",
            title: {
              content: options.title,
              tag: "plain_text",
            },
          },
        },
      }),
    });
    return response;
  }

  /**
   * 企业微信Webhook
   * @param options
   */
  async wecomWebhook(options) {
    const url = env.WEIXIN_WEBHOOK;
    if (!url || url === "") {
      throw new Error("未配置企业微信Webhook。");
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        msgtype: "text",
        text: {
          content: `${options.content}`,
        },
      }),
    });
    return response;
  }

  async weixinWebhook(options) {
    return this.wecomWebhook(options);
  }

  /**
   * 微秘书webhook
   * @param options
   */
  async wimishuWebhook(options) {
    const url = env.AIBOTK_HOOK;
    if (!url || url === "") {
      throw new Error("未配置微秘书Hook地址");
    }
    let res = "";
    if (env.AIBOTK_ROOM_RECIVER) {
      console.log(`微秘书推送给群组：${env.AIBOTK_CONTACT_RECIVER}`);
      res = await fetch(url + "/openapi/v1/chat/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: env.AIBOTK_KEY,
          roomName: env.AIBOTK_ROOM_RECIVER,
          message: {
            type: 1,
            content: `${options.content}`,
          },
        }),
      });
              const resData = await res.json();
        console.log(`微秘书推送给群组结果：${JSON.stringify(resData)}`);
    }
    if (env.AIBOTK_CONTACT_RECIVER) {
      console.log(`微秘书推送给好友：${env.AIBOTK_CONTACT_RECIVER}`);
      res = await fetch(url + "/openapi/v1/chat/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: env.AIBOTK_KEY,
          name: env.AIBOTK_CONTACT_RECIVER,
          message: {
            type: 1,
            content: `${options.content}`,
          },
        }),
      });
              const resData = await res.json();
        console.log(`微秘书推送给好友结果：${JSON.stringify(resData)}`);
    }
    return res;
  }

  newVersion = {
    has: false,
    name: pkg.version,
    url: pkg.homepage,
  };

  async checkupdate() {
    try {
      const result = await fetch(pkg.releases_url);
      const data = (await result.json())[0];
      this.newVersion.has = pkg.version < data.tag_name.replace(/^v/, "");
      this.newVersion.name = data.tag_name;
    } catch (e) {}
  }

  async pushMessage(options) {
    const trycatch = async (name, fn) => {
      try {
        await fn(options);
        console.log(`[${name}]: 消息推送成功!`);
      } catch (e) {
        console.log(`[${name}]: 消息推送失败! 原因: ${e.message}`);
      }
    };

    await this.checkupdate();
    if (this.newVersion.has) {
      console.log(`Dify工作流定时助手 ${this.newVersion.name} 现在可用`);
    }

    await trycatch("邮件", this.email.bind(this));
    await trycatch("钉钉", this.dingtalkWebhook.bind(this));
    await trycatch("微信", this.wecomWebhook.bind(this));
    await trycatch("微秘书", this.wimishuWebhook.bind(this));
    await trycatch("PushPlus", this.pushplus.bind(this));
    await trycatch("Server酱", this.serverPush.bind(this));
    await trycatch("飞书", this.feishuWebhook.bind(this));
  }
}

export default new Notify();
