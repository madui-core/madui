import { highlighter } from "@/utils/highlighter" 

export const logger = {
  error: (...args: any[]) => {
    console.error(highlighter.error(args.join(" ")))
  },
  warn: (...args: any[]) => {
    console.log(highlighter.warn(args.join(" ")))
  },
  info: (...args: any[]) => {
    console.log(highlighter.info(args.join(" ")))
  },
  success: (...args: any[]) => {
    console.log(highlighter.success(args.join(" ")))
  },
  log: (...args: any[]) => {
    console.log(args.join(" "))
  },
  break: () => {
    console.log("")
  },
}