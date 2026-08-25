"use client";

import Link from "next/link";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Config = { apiKey:string; authDomain:string; projectId:string; storageBucket:string; messagingSenderId:string; appId:string; vapidKey:string };
type FirebaseCompat = { apps: unknown[]; initializeApp(config: Omit<Config,"vapidKey">): unknown; messaging(): { getToken(options:{vapidKey:string;serviceWorkerRegistration:ServiceWorkerRegistration}):Promise<string> } };
declare global { interface Window { firebase?: FirebaseCompat } }

function script(src:string) { return new Promise<void>((resolve,reject)=>{ const current=document.querySelector(`script[src="${src}"]`); if(current){resolve();return;} const node=document.createElement("script");node.src=src;node.async=true;node.onload=()=>resolve();node.onerror=()=>reject(new Error("Notification library could not load."));document.head.appendChild(node); }); }

export default function NotificationBell() {
  const [count,setCount]=useState(0); const [config,setConfig]=useState<Config|null>(null); const [busy,setBusy]=useState(false); const [status,setStatus]=useState("");
  const load=useCallback(async()=>{try{const response=await fetch("/api/admin/notifications",{cache:"no-store"});if(!response.ok)return;const data=await response.json() as {unreadCount?:number;publicConfig?:Config};setCount(data.unreadCount||0);setConfig(data.publicConfig||null);}catch{/* Bell remains optional. */}},[]);
  useEffect(()=>{
    // Initial count comes from the authenticated notification API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();const timer=window.setInterval(()=>void load(),120000);return()=>window.clearInterval(timer)
  },[load]);
  async function enable(){setBusy(true);setStatus("");try{
    if(!config||!config.apiKey||!config.projectId||!config.messagingSenderId||!config.appId||!config.vapidKey) throw new Error("Push notifications need the production Firebase web configuration.");
    if(!("serviceWorker" in navigator)||!("Notification" in window)) throw new Error("This browser does not support notifications.");
    const permission=await Notification.requestPermission();if(permission!=="granted") throw new Error("Notifications were not enabled. You can continue using CentreOS normally.");
    await script("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");await script("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");
    const query=new URLSearchParams({apiKey:config.apiKey,authDomain:config.authDomain,projectId:config.projectId,storageBucket:config.storageBucket,messagingSenderId:config.messagingSenderId,appId:config.appId});
    const registration=await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`,{scope:"/"});
    const firebase=window.firebase;if(!firebase)throw new Error("Firebase Messaging did not load.");if(firebase.apps.length===0)firebase.initializeApp(config);
    const token=await firebase.messaging().getToken({vapidKey:config.vapidKey,serviceWorkerRegistration:registration});if(!token)throw new Error("Chrome did not return a notification token.");
    const response=await fetch("/api/admin/notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"register-device",token,deviceName:/Android/i.test(navigator.userAgent)?"Chrome on Android":"Chrome browser",browser:navigator.userAgent.slice(0,80)})});const result=await response.json() as {success?:boolean;message?:string};if(!response.ok||!result.success)throw new Error(result.message||"Device registration failed.");setStatus("Notifications enabled");
  }catch(error){setStatus(error instanceof Error?error.message:"Notifications could not be enabled.");}finally{setBusy(false)}}
  return <div className="relative flex items-center gap-1.5"><Link href="/admin/notifications" aria-label={`${count} unread notifications`} className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-[#E5DBEA] bg-white text-[#632B87] hover:bg-[#F7F2FA]">{count?<BellRing size={19}/>:<Bell size={19}/>} {count?<span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-[10px] font-black leading-5 text-white">{count>99?"99+":count}</span>:null}</Link>{typeof Notification!=="undefined"&&Notification.permission!=="granted"?<button type="button" disabled={busy} onClick={()=>void enable()} className="hidden min-h-10 rounded-xl bg-[#F2EAF6] px-3 text-[11px] font-black text-[#632B87] xl:inline-flex xl:items-center xl:gap-1.5">{busy?<Loader2 className="animate-spin" size={14}/>:<Bell size={14}/>} Enable alerts</button>:null}{status?<span className="sr-only" role="status">{status}</span>:null}</div>;
}
