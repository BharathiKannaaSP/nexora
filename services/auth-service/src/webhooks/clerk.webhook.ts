import { Request, Response } from "express"
import { verifyWebhook } from "@clerk/express/webhooks"
import { createUserIfNotExists } from "../services/auth.service"

export const handleClerkWebhook = async (req: Request, res: Response) => {
  try {
    const evt = await verifyWebhook(req)

    console.log(`Received Clerk webhook, ${evt.type}`)

    if (evt.type === "user.created") {
      const user = await createUserIfNotExists({
        clerkUserId: evt.data.id,
        email:
          evt.data.email_addresses.find(
            (email) => email.id === evt.data.primary_email_address_id
          )?.email_address ?? "",
        firstName: evt.data.first_name,
        lastName: evt.data.last_name,
        imageUrl: evt.data.image_url,
      })

      console.log(`Auth user synchronized: ${user.clerkUserId}`)

      return res.status(200).json({
        message: "User created successfully",
        success: true,
      })
    }
  } catch (error) {
    console.error("Clerk webhook verification failed:", error)

    return res.status(400).json({
      success: false,
      message: "Invalid Clerk webhook",
    })
  }
}
