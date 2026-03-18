import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    stances: [
      { value: "cold", label: "冷静克制", description: "适合品牌态度表达，不抢情绪。", recommendedChannels: ["wechat", "xiaohongshu"] },
      { value: "warm", label: "热情参与", description: "适合借势共鸣，强调参与感。", recommendedChannels: ["xiaohongshu", "weibo"] },
      { value: "humorous", label: "轻松幽默", description: "适合轻快传播，但需要控制分寸。", recommendedChannels: ["weibo", "video"] },
      { value: "deep", label: "深度表达", description: "适合延展观点和品牌判断。", recommendedChannels: ["wechat", "video"] }
    ],
    channels: [
      { value: "xiaohongshu", label: "小红书" },
      { value: "weibo", label: "微博" },
      { value: "wechat", label: "公众号" },
      { value: "video", label: "视频号" }
    ],
    note: "当前为骨架占位数据，等待 hotspot.md 到位后替换成正式规则与推荐逻辑。"
  });
}
