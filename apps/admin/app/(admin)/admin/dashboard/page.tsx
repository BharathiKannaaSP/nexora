import { auth } from "@clerk/nextjs/server"
import React from "react"

const DashboardPage = async () => {
  const { userId } = await auth.protect()

  if (!userId) {
    alert("User not logged in")
  }

  return <div>DashboardPage</div>
}

export default DashboardPage
