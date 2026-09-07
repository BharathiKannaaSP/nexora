import { auth } from "@clerk/nextjs/server"
import React from "react"

const DashboardPage = async () => {
  const { userId, getToken } = await auth.protect()

  const token = await getToken()

  console.log("User ID:", userId)
  console.log("Token:", token)

  if (!userId) {
    alert("User not logged in")
  }

  return <div>DashboardPage</div>
}

export default DashboardPage
