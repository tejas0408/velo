"use client";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import {useTRPC} from "@/trpc/client"
import { useMutation } from "@tanstack/react-query"
import {useState} from "react"
const Page=  ()=>{
  const [Value, setValue]= useState("");
  const trpc= useTRPC();
  const invoke = useMutation(trpc.invoke.mutationOptions({}));
  return(
    <div className="p-4 max-w-7x1 mx-auto">
      <Input value={Value} onChange={(e)=> setValue(e.target.value)}/>
      <Button disabled={invoke.isPending} onClick={()=> invoke.mutate({value: Value})}>
        Invoke background job
      </Button>
    </div>
  );
};

export default Page;
