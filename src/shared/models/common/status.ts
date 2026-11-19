import type { StatusCode } from "../../constants/statusConstants"

export interface StatusRecord {
  Id: number
  StatusCode: StatusCode
  StatusName: string
}