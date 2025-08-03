import {Agent,openai, createAgent, createTool, createNetwork } from "@inngest/agent-kit";
import { inngest } from "./client";
import {Sandbox} from "@e2b/code-interpreter"
import { stepsSchemas } from "inngest/api/schema";
import { getSanbox, lastAssistantTextMessageContent } from "./utils";
import { Command, Files } from "lucide-react";
import { stderr, stdout } from "process";
import {z} from "zod";
import { Content } from "vaul";
import { handler } from "next/dist/build/templates/app-page";
import { PROMPT } from "@/prompts";



export const helloWorld = inngest.createFunction(
  {id:"hello-world"},
  {event: "test/hello.world"},
   async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async()=>{
    const sandbox = await Sandbox.create(""); 
    return sandbox.sandboxId;
    });
    
    
    const codeAgent = createAgent({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({ 
        model: "gpt-4.1",
      defaultParameters:{
           temperature: 0.1,

      }
    }),
   })
  }
)
