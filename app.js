(() => {
'use strict';
const cfg=window.PEGASUS_CONFIG||{};
const safe={get(k){try{return sessionStorage.getItem(k)}catch{return null}},set(k,v){try{sessionStorage.setItem(k,v)}catch{}},remove(k){try{sessionStorage.removeItem(k)}catch{}}};
const consentKey='pegasus_measurement';
function getConsent(){try{return localStorage.getItem(consentKey)||''}catch{return ''}}
function setConsent(v){try{localStorage.setItem(consentKey,v)}catch{}}
let pixelLoaded=false;
function pixel(){
 if(pixelLoaded||!cfg.pixelId||getConsent()!=='yes')return;
 pixelLoaded=true;
 const f=window.fbq=function(){f.callMethod?f.callMethod.apply(f,arguments):f.queue.push(arguments)};
 f.queue=[];f.loaded=true;f.version='2.0';window._fbq=f;
 const s=document.createElement('script');s.async=true;s.src='https://connect.facebook.net/en_US/fbevents.js';document.head.appendChild(s);
 f('init',cfg.pixelId);f('track','PageView');
}
function trackLead(id){if(window.fbq&&getConsent()==='yes')window.fbq('track','Lead',{}, {eventID:id})}
const banner=document.querySelector('#cookie-banner');
function showConsent(){if(banner){banner.hidden=false;banner.style.display='block'}}
function hideConsent(){if(banner){banner.hidden=true;banner.style.display='none'}}
document.querySelectorAll('[data-cookie-settings]').forEach(b=>b.addEventListener('click',showConsent));
document.querySelectorAll('[data-consent]').forEach(b=>b.addEventListener('click',()=>{setConsent(b.dataset.consent);hideConsent();if(b.dataset.consent==='yes'){pixel()}else if(window.fbq){window.fbq('consent','revoke')}}));
if(cfg.pixelId&&!getConsent())showConsent();else pixel();
const url=new URL(location.href);
const attrs={};['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(k=>{const v=url.searchParams.get(k);if(v)attrs[k]=v.slice(0,200)});
if(Object.keys(attrs).length)safe.set('pegasus_utm',JSON.stringify(attrs));
let requestId=safe.get('pegasus_request_id')||crypto.randomUUID();safe.set('pegasus_request_id',requestId);
const form=document.querySelector('#optin-form');
if(form){
 const status=document.querySelector('#form-status');const submit=form.querySelector('button[type=submit]');
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(!form.reportValidity())return;
  if(form.website.value)return;
  if(!cfg.endpoint){status.textContent='The request form is being connected. Please try again shortly or call +1 315 510 9212.';return}
  submit.disabled=true;submit.textContent='Preparing your kit…';status.textContent='Saving your request securely…';
  let savedAttrs={};try{savedAttrs=JSON.parse(safe.get('pegasus_utm')||'{}')}catch{}
  const payload={action:'lead',requestId,firstName:form.firstName.value.trim(),email:form.email.value.trim(),website:'',utm:savedAttrs,landingPage:location.origin+location.pathname,consent:getConsent()==='yes',test:url.searchParams.get('test')==='1',version:cfg.version};
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),25000);
  try{
   const res=await fetch(cfg.endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),redirect:'follow',signal:controller.signal});
   const data=await res.json();if(!data.ok||data.requestId!==requestId)throw Error(data.error||'Save failed');
   safe.remove('pegasus_request_id');safe.set('pegasus_completed',requestId);safe.set('pegasus_test',payload.test?'1':'0');
   if(!payload.test)trackLead(requestId);
   location.assign('thank-you.html');
  }catch(err){status.textContent='We could not confirm your request. Your details are still here. Please try again or call +1 315 510 9212.';submit.disabled=false;submit.textContent='Get My Free Capacity Kit ↗'}
  finally{clearTimeout(timer)}
 });
}
document.querySelectorAll('[data-booking]').forEach(a=>{
 a.href=cfg.bookingUrl||a.href;
 a.addEventListener('click',()=>{if(window.fbq&&getConsent()==='yes')window.fbq('trackCustom','CapacityReviewClick');});
});
})();
