import assert from 'node:assert/strict';

async function prepareScreenshots(page) {
  // Visit each viewport so normal scroll-reveal animations finish before a full-page capture.
  await page.evaluate(async()=>{
    for(let y=0;y<document.documentElement.scrollHeight;y+=innerHeight*.8){
      window.scrollTo({top:y,behavior:'instant'});
      await new Promise(resolve=>setTimeout(resolve,75));
    }
    window.scrollTo({top:0,behavior:'instant'});
  });
  await page.waitForTimeout(400);
}

async function waitForImages(page) {
  await page.evaluate(()=>document.querySelectorAll('img').forEach(img=>{img.loading='eager';}));
  // A viewport resize can replace currentSrc after decode() has started. Wait for
  // the selected responsive resource, not a cancelled decode of the prior size.
  await page.waitForFunction(()=>[...document.images].every(img=>img.complete&&img.naturalWidth>0),null,{timeout:30000}).catch(async error=>{
    const failed=await page.locator('img').evaluateAll(images=>images.filter(img=>!img.complete||!img.naturalWidth).map(img=>({src:img.currentSrc||img.src,complete:img.complete,width:img.naturalWidth})));
    throw new Error('Responsive images did not load: '+JSON.stringify(failed),{cause:error});
  });
}

export async function verifyWebsiteSession({browser,chromium,pool,origin,output,results}) {
  for (const width of [320,360,390,430,768,1440]) {
    const context=await browser.newContext({viewport:{width,height:900}});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror', error=>errors.push(error.message));
    await page.goto(origin+'/admissions', {waitUntil:'networkidle'});
    assert.equal(await page.locator('h1').count(),1);
    assert.match(await page.locator('h1').innerText(), /Preschool admissions/i);
    assert.equal(await page.locator('#early-start-offer').count(),1);
    assert.equal(await page.locator('#childName').isVisible(),true,'The website retains its full enquiry form');
    assert.equal(await page.locator('#enquiryType').inputValue(),'SCHOOL_VISIT');
    assert.equal(await page.locator('#parentName').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))>=16,true);
    await page.locator('#offer-terms summary').click();
    assert.match(await page.locator('#offer-terms').innerText(), /December 2026/);
    assert.match(await page.locator('#offer-terms').innerText(), /Tuition Begins in March/);
    assert.doesNotMatch(await page.locator('main').innerText(), /₹|2026[–-]27/);
    await page.locator('#offer-terms summary').click();
    const anchors=await page.locator('main a[href^="#"]').evaluateAll(links=>links.map(a=>a.getAttribute('href')).filter(h=>!document.getElementById(h.slice(1))));
    assert.deepEqual(anchors,[]);
    if(width<1280) {
      await page.getByRole('button',{name:'Open navigation menu',exact:true}).click();
      await page.getByRole('dialog',{name:'Mobile navigation'}).waitFor();
      assert.equal(await page.getByRole('dialog').getByRole('link',{name:'Programmes',exact:true}).isVisible(),true);
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('dialog',{name:'Mobile navigation'}).count(),0);
      assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
    }
    await waitForImages(page);
    assert.deepEqual(await page.locator('img').evaluateAll(images=>images.filter(img=>!img.complete||!img.naturalWidth).map(img=>img.src)),[]);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Website admissions overflow at '+width);
    await prepareScreenshots(page);
    await page.screenshot({path:output+'/website-admissions-'+width+'.png',fullPage:true});
    await page.screenshot({path:output+'/website-admissions-'+width+'-viewport.png'});
    if(width===390) {
      const style=await page.addStyleTag({content:'html{font-size:200%!important}'});
      await page.waitForFunction(()=>parseFloat(getComputedStyle(document.documentElement).fontSize)>=32);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Website admissions reflows with large text');
      await page.screenshot({path:output+'/website-admissions-390-large-text.png'});
      await style.evaluate(el=>el.remove());
    }
    assert.deepEqual(errors,[]);
    results.push({route:'/admissions',width,websiteLayout:'pass',fullForm:'pass',offer:'pass',mobileNavigation:'pass',images:'pass'});
    await context.close();
  }
  // Same real localhost API and disposable database as campaign checks. Never the live website.
  for(const [index,preset] of ['SCHOOL_VISIT','FEES','DAYCARE'].entries()) {
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage();
    await page.addInitScript(()=>{
      window.__websiteEvents=[];
      window.__websitePopupCount=0;
      window.addEventListener('kidzee:website-event',e=>window.__websiteEvents.push(e.detail));
      window.open=()=>{window.__websitePopupCount++;return null;};
    });
    const submissions=[];
    await page.route('**/api/website/enquiry',async route=>{
      submissions.push(route.request().postDataJSON());
      if(submissions.length===1) await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:false,message:'Temporary website test failure. Try again.'})});
      else await route.continue();
    });
    await page.goto(origin+`/admissions?enquiry=${preset}&programme=${preset==='DAYCARE'?'DAYCARE':'NURSERY'}&utm_source=google&utm_medium=cpc&utm_campaign=website_session_test&gclid=synthetic_website_click`,{waitUntil:'networkidle'});
    assert.equal(await page.locator('#enquiryType').inputValue(),preset);
    const submit=page.getByRole('button',{name:'Send Enquiry',exact:true});
    await submit.click();
    assert.equal(submissions.length,0);
    await page.locator('#parentName').fill('Website Browser Parent '+index);
    await page.locator('#phone').fill('900000004'+index);
    await submit.click();
    await page.getByRole('alert').filter({hasText:'Temporary website test failure'}).waitFor();
    assert.equal(await page.evaluate(()=>window.__websiteEvents.filter(e=>e.eventType==='FORM_SUBMITTED').length),0);
    const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/website/enquiry')&&r.status()===201);
    await submit.click();
    const response=await responsePromise;
    const saved=await response.json();
    await page.getByRole('heading',{name:'Thank you. We have your enquiry.',exact:true}).waitFor();
    assert.equal(submissions[0].submissionId,submissions[1].submissionId);
    const payload=submissions[1];
    assert.equal(payload.enquiryType,preset);
    assert.equal(payload.gclid,'synthetic_website_click');
    assert.equal(payload.utmCampaign,'website_session_test');
    assert.equal(payload.landingPageId,'');
    assert.equal(await page.evaluate(()=>window.__websitePopupCount),0);
    assert.equal(await page.evaluate(()=>window.__websiteEvents.filter(e=>e.eventType==='FORM_SUBMITTED').length),1);
    const handoff=page.getByRole('link',{name:'Continue on WhatsApp',exact:true});
    assert.ok((await handoff.getAttribute('href')).includes(encodeURIComponent(saved.enquiryNumber)));
    await handoff.evaluate(el=>el.addEventListener('click',event=>event.preventDefault()));
    await handoff.click();
    assert.equal(await page.evaluate(()=>window.__websiteEvents.filter(e=>e.eventType==='WHATSAPP_CLICK').length),1);
    const retry=await context.request.post(origin+'/api/website/enquiry',{data:payload});
    assert.equal(retry.status(),200);
    assert.equal((await retry.json()).enquiryNumber,saved.enquiryNumber);
    const count=await pool.query('SELECT COUNT(*)::int AS count FROM "WebsiteLeadSubmission" WHERE "submissionId"=$1',[payload.submissionId]);
    assert.equal(count.rows[0].count,1);
    results.push({route:'/admissions',preset,validation:'pass',failedSaveRecovery:'pass',centreos:'pass',attribution:'pass',whatsAppReference:'pass',singleLead:'pass'});
    await context.close();
  }
  const publicRoutes=['/','/about','/programmes','/programmes/playgroup','/programmes/nursery','/programmes/junior-kg','/programmes/senior-kg','/daycare','/contact','/gallery','/blog','/careers','/privacy-policy','/terms'];
  const titles=new Set();
  for(const route of publicRoutes) {
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    const response=await page.goto(origin+route,{waitUntil:'networkidle'});
    assert.equal(response.status(),200,route);
    assert.equal(await page.locator('h1').count(),1,route+' has one main heading');
    const title=await page.title();assert.ok(title.length>10);assert.ok(!titles.has(title),route+' has a unique title');titles.add(title);
    const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');
    assert.equal(new URL(canonical).pathname,route);
    assert.ok((await page.locator('meta[name="description"]').getAttribute('content')).length>40);
    assert.equal(await page.locator('img:not([alt])').count(),0);
    for(const json of await page.locator('script[type="application/ld+json"]').allTextContents()) assert.doesNotThrow(()=>JSON.parse(json));
    if(!['/privacy-policy','/terms'].includes(route))assert.doesNotMatch(await page.locator('main').innerText(),/2026[–-]27|8:30 AM/);
    for(const width of [320,768,1440]) {
      await page.setViewportSize({width,height:900});
      await waitForImages(page);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route+' overflow at '+width);
      assert.deepEqual(await page.locator('img').evaluateAll(images=>images.filter(img=>!img.complete||!img.naturalWidth).map(img=>img.src)),[],route+' images');
      await prepareScreenshots(page);
      await page.screenshot({path:output+'/website-'+(route==='/'?'home':route.slice(1).replaceAll('/','-'))+'-'+width+'.png',fullPage:true});
    }
    assert.deepEqual(errors,[],route+' browser errors');
    results.push({route,responsiveWidths:[320,768,1440],images:'pass',metadata:'pass',headings:'pass',structuredDataJson:'pass'});
    await context.close();
  }
  const mediaBrowser=await chromium.launch({channel:'chrome'});
  try {
    const context=await mediaBrowser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin+'/website-browser-media-check',{waitUntil:'networkidle'});
    for(let index=0;index<5;index++) {
      const block=page.locator(`[data-video-fixture="${index}"]`);
      await block.getByRole('button',{name:'Play Video '+index,exact:true}).click();
      await page.waitForFunction(index=>{
        const video=document.querySelector(`[data-video-fixture="${index}"] video`);
        return !video.paused&&video.currentTime>0.2&&video.videoWidth>0;
      },index,{timeout:30000});
      await block.getByRole('button',{name:'Pause Video '+index,exact:true}).click();
      assert.equal(await block.locator('video').evaluate(video=>video.paused),true);
    }
    await page.getByRole('button',{name:'Show photograph 2',exact:true}).click();
    assert.equal(await page.getByRole('img',{name:'Second centre photograph'}).isVisible(),true);
    const pause=page.getByRole('button',{name:'Pause automatic photographs',exact:true});
    assert.ok((await pause.boundingBox()).height>=44);
    await pause.click();
    assert.equal(await page.getByRole('button',{name:'Resume automatic photographs',exact:true}).count(),1);
    await page.route('https://www.instagram.com/**',route=>route.abort());
    await page.getByRole('button',{name:'Load Instagram Reel: External video',exact:true}).click();
    const external=page.getByRole('link',{name:'Open on Instagram',exact:true});
    assert.equal(await external.isVisible(),true);
    assert.equal(await external.getAttribute('href'),'https://www.instagram.com/reel/DYg8ahfhUuq/');
    // Simulate a media delivery failure; the player must recover without an unhandled promise.
    await page.route('**/playschool-security-review.mp4',route=>route.abort());
    await page.reload({waitUntil:'networkidle'});
    const failed=page.locator('[data-video-fixture="0"]');
    await failed.getByRole('link',{name:'Open video in a new tab',exact:true}).waitFor();
    await failed.getByRole('button',{name:'Play Video 0',exact:true}).click();
    assert.equal(await failed.getByRole('link',{name:'Open video in a new tab'}).isVisible(),true);
    assert.deepEqual(errors,[]);
    results.push({hostedVideos:2,localVideos:3,videoPlaybackAndPause:'pass',videoErrorFallback:'pass',externalEmbedFallback:'pass',slideshowControls:'pass'});
    await context.close();
  } finally { await mediaBrowser.close(); }
  const sitemap=await (await fetch(origin+'/sitemap.xml')).text();
  assert.ok(sitemap.includes('/admissions</loc>'));
  assert.ok(!sitemap.includes('/landing/preschool-admissions-dwarka-sector-12</loc>'));
  assert.ok(!sitemap.includes('/landing/browser-managed-control</loc>'));
  results.push({sitemap:'pass',paidNoindexExcluded:'pass'});
}
