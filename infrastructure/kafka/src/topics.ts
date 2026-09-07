export const KAFKA_TOPICS = {
  USER_CREATED: "user.created",
} as const

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS]
