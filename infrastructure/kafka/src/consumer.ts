import { kafka } from "./client.js"

export const createConsumer = (groupId: string) => {
  return kafka.consumer({
    groupId,
  })
}
