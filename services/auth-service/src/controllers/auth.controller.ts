import { Response } from "express"
import { GatewayRequest } from "../middleware/requireGateway"
import { getCurrentUser } from "../services/auth.service"

export const getMe = async (req: GatewayRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthenticated",
      })
    }

    const user = await getCurrentUser(req.userId)

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        clerkUserId: user.clerkUserId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        systemRole: user.systemRole,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === "USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    console.error("Failed to get current user:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}
