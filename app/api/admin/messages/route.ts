import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    const messages = await prisma.internalMessage.findMany({
      where: {
        OR: [
          { senderId: session.userId },
          { recipientId: session.userId },
          { recipientId: null }, // Announcements
        ],
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        recipient: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const unreadCount = await prisma.internalMessage.count({
      where: {
        recipientId: session.userId,
        isRead: false,
      },
    });

    // Also get staff/admin directory for composing new messages
    const colleagues = await prisma.adminUser.findMany({
      where: { active: true, id: { not: session.userId } },
      select: { id: true, name: true, role: true, email: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      messages,
      unreadCount,
      colleagues,
    });
  } catch (error) {
    console.error("Internal messages load error:", error);
    return NextResponse.json({ success: false, message: "Unable to load messages." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    const body = await request.json();
    const recipientId = typeof body.recipientId === "string" && body.recipientId.trim()
      ? body.recipientId.trim()
      : null;
    const subject = typeof body.subject === "string" ? body.subject.trim() || null : null;
    const messageBody = typeof body.body === "string" ? body.body.trim() : "";
    let threadId = typeof body.threadId === "string" && body.threadId.trim()
      ? body.threadId.trim()
      : null;

    if (!messageBody) {
      return NextResponse.json({ success: false, message: "Message content cannot be empty." }, { status: 400 });
    }

    if (!threadId) {
      // Create thread between sender and recipient
      const participants = [session.userId, recipientId ?? "broadcast"].sort();
      threadId = `THR-${participants.join("-")}`;
    }

    const message = await prisma.internalMessage.create({
      data: {
        threadId,
        senderId: session.userId,
        recipientId,
        subject,
        body: messageBody,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, message: "Message sent.", data: message });
  } catch (error) {
    console.error("Internal message send error:", error);
    return NextResponse.json({ success: false, message: "Unable to send message." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    const body = await request.json();
    const messageId = typeof body.messageId === "string" ? body.messageId.trim() : "";
    const threadId = typeof body.threadId === "string" ? body.threadId.trim() : "";

    if (messageId) {
      await prisma.internalMessage.updateMany({
        where: { id: messageId, recipientId: session.userId },
        data: { isRead: true, readAt: new Date() },
      });
    } else if (threadId) {
      await prisma.internalMessage.updateMany({
        where: { threadId, recipientId: session.userId },
        data: { isRead: true, readAt: new Date() },
      });
    }

    return NextResponse.json({ success: true, message: "Marked as read." });
  } catch (error) {
    console.error("Internal message read update error:", error);
    return NextResponse.json({ success: false, message: "Unable to update read status." }, { status: 500 });
  }
}
