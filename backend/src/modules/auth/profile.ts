import { Request, Response, NextFunction } from "express";
import prisma from "../../db/client.js";
import { generateTokens } from "../../core/crypto.js";
import { hashPassword } from "../../core/crypto.js";

interface CompleteProfileRequest {
  name: string;
  phoneNumber: string;
  tosAccepted: boolean;
}

export const completeProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.sub) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { name, phoneNumber, tosAccepted } = req.body as CompleteProfileRequest;

    if (!name || !name.trim()) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      res.status(400).json({ error: "Phone number is required" });
      return;
    }

    if (!tosAccepted) {
      res.status(400).json({ error: "You must accept the Terms of Service to continue" });
      return;
    }

    // Validate phone number format if provided
    if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\D/g, ""))) {
      res.status(400).json({ error: "Invalid phone number format" });
      return;
    }

    // Update user profile
    const user = await prisma.user.update({
      where: { id: req.user.sub },
      data: {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        tosAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
    });

    // Generate new tokens with updated user info
    const entitlements = await prisma.entitlement.findMany({
      where: { userId: user.id, status: "active" },
      select: { planId: true },
    });
    const entitlementScopes = entitlements.map(e => `plan:${e.planId}`);

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      user.id,
      req.user.sid || "",
      ["openid", "profile", "email"],
      user.roles,
      user.name,
      undefined,
      entitlementScopes
    );

    res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        profilePictureUrl: user.profilePictureUrl,
        tosAcceptedAt: user.tosAcceptedAt,
        privacyAcceptedAt: user.privacyAcceptedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
