import assert from 'node:assert/strict';
import path from 'node:path';

export async function verifyParentReviews({ chromium, origin, output }) {
  const browser = await chromium.launch({channel:'chrome'});
  const results = [];
  try {
    for (const width of [320,390,768,1440]) {
      const context = await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
      const page = await context.newPage();
      const requests = [];
      page.on('request',r=>{if(/instagram\.com|\.mp4/.test(r.url()))requests.push(r.url());});
      await page.addInitScript(()=>{window.__reviewEvents=[];window.addEventListener('kidzee:website-event',e=>window.__reviewEvents.push(e.detail));});
      await page.route('https://www.instagram.com/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<p>Isolated external player fixture</p>'}));
      await page.goto(origin+'/website-browser-media-check?campaignReviews=two',{waitUntil:'networkidle'});
      const gallery = page.locator('[data-parent-reviews]');
      await gallery.scrollIntoViewIfNeeded();
      await gallery.locator('img').evaluateAll(async images=>Promise.all(images.map(i=>i.decode())));
      assert.equal(await gallery.getByRole('button',{name:/Choose parent review/}).count(),2);
      assert.deepEqual(requests,[],'No video or third-party player before tap');
      assert.equal(await gallery.locator('iframe,video[src]').count(),0);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await gallery.screenshot({path:path.join(output,`parent-reviews-${width}.png`)});
      await page.locator('#parentName').fill('Unsaved review test');
      const firstPoster = await gallery.getByRole('button',{name:'Play parent review 1',exact:true}).locator('img').getAttribute('src');
      await gallery.getByRole('button',{name:'Choose parent review 2',exact:true}).click();
      const secondPoster = await gallery.getByRole('button',{name:'Play parent review 2',exact:true}).locator('img').getAttribute('src');
      assert.notEqual(firstPoster,secondPoster,'The second parent must have their own thumbnail');
      assert.equal(await gallery.getByRole('button',{name:'Choose parent review 2',exact:true}).getAttribute('aria-pressed'),'true');
      await gallery.getByRole('button',{name:'Play parent review 2',exact:true}).click();
      assert.equal(await gallery.locator('iframe').count(),1);
      assert.equal(await gallery.locator('iframe').getAttribute('src'),'https://www.instagram.com/reel/DYg8ahfhUuq/embed/');
      assert.ok(await gallery.getByRole('link',{name:'Open on Instagram'}).isVisible());
      await gallery.getByRole('button',{name:'Previous',exact:true}).click();
      assert.equal(await gallery.locator('iframe').count(),0,'Switching reviews unmounts the active player');
      await gallery.getByRole('button',{name:'Play parent review 1',exact:true}).click();
      assert.equal(await gallery.locator('iframe').getAttribute('src'),'https://www.instagram.com/reel/Db78s7ehDRu/embed/');
      assert.equal(await page.locator('#parentName').inputValue(),'Unsaved review test');
      assert.equal(await page.evaluate(()=>window.__reviewEvents.filter(e=>['FORM_SUBMITTED','WHATSAPP_CLICK'].includes(e.eventType)).length),0);
      results.push({width,twoReviewThumbnails:'pass',inlineSelection:'pass',singlePlayer:'pass',noLeadEvents:'pass',formStatePreserved:'pass'});
      await context.close();
    }
    {
      const context = await browser.newContext({viewport:{width:320,height:900}});
      const page = await context.newPage();
      await page.goto(origin+'/website-browser-media-check?campaignReviews=many',{waitUntil:'networkidle'});
      const gallery = page.locator('[data-parent-reviews]');
      assert.equal(await gallery.getByRole('button',{name:/Choose parent review/}).count(),12,'All future reviews remain available');
      const height = (await gallery.boundingBox()).height;
      for(let i=1;i<12;i++) await gallery.getByRole('button',{name:'Next',exact:true}).click();
      assert.ok(await gallery.getByText('Review 12 of 12',{exact:true}).isVisible());
      assert.equal(await gallery.getByRole('button',{name:'Next',exact:true}).isDisabled(),true);
      assert.equal((await gallery.boundingBox()).height,height,'Future reviews should not lengthen the page');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      const first = gallery.getByRole('button',{name:'Choose parent review 1',exact:true});
      await first.focus();await page.keyboard.press('Enter');
      assert.equal(await first.getAttribute('aria-pressed'),'true');
      await page.addStyleTag({content:'html{font-size:200%!important}'});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Text zoom must not cause page overflow');
      await gallery.screenshot({path:path.join(output,'parent-reviews-many-zoom.png')});
      results.push({futureReviewCount:12,compactStrip:'pass',keyboard:'pass',textZoom:'pass'});
      await context.close();
    }
    for (const fail of [false,true]) {
      const context = await browser.newContext({viewport:{width:390,height:844}});
      const page = await context.newPage();
      if(fail) await page.route('**/videos/parent-reviews-dwarka-sec12.mp4',r=>r.abort());
      await page.goto(origin+'/website-browser-media-check?campaignReviews=native',{waitUntil:'networkidle'});
      const gallery = page.locator('[data-parent-reviews]');
      assert.equal(await gallery.locator('video').getAttribute('src'),null);
      assert.equal(await gallery.locator('video').getAttribute('preload'),'none');
      await gallery.getByRole('button',{name:'Play parent review 1',exact:true}).click();
      if(fail){
        await gallery.getByRole('status').filter({hasText:'The video could not load'}).waitFor();
        assert.ok(await gallery.getByRole('link',{name:'Open the original video'}).isVisible());
      }else{
        await page.waitForFunction(()=>{const v=document.querySelector('[data-parent-reviews] video');return v&&!v.paused&&v.currentTime>.2&&v.videoWidth>0;},null,{timeout:30000});
        await gallery.locator('video').evaluate(v=>v.pause());
        assert.equal(await gallery.locator('video').evaluate(v=>v.paused),true);
      }
      await gallery.getByRole('button',{name:'Next',exact:true}).click();
      assert.equal(await gallery.locator('video,iframe').count(),0,'No previous media remains playing');
      results.push({uploadedVideo:fail?'failure fallback pass':'playback and pause pass',switchStopsPlayback:'pass'});
      await context.close();
    }
    {
      const context = await browser.newContext({viewport:{width:390,height:844}});
      const page = await context.newPage();
      const image = await page.request.get(origin+'/images/hero/hero-classroom.jpg');
      const body = await image.body();
      await page.route('https://firebasestorage.googleapis.com/v0/b/browser-fixture/**',r=>r.fulfill({status:200,contentType:'image/jpeg',body}));
      await page.goto(origin+'/website-browser-media-check?campaignReviews=stored-images',{waitUntil:'networkidle'});
      const gallery=page.locator('[data-parent-reviews]');
      await gallery.scrollIntoViewIfNeeded();
      await gallery.locator('img').evaluateAll(async images=>Promise.all(images.map(i=>i.decode())));
      for(const locator of [gallery.getByRole('button',{name:'Play parent review 1',exact:true}),gallery.getByRole('button',{name:'Choose parent review 1',exact:true})]){
        assert.match(await locator.locator('img').getAttribute('src'),/^https:\/\/firebasestorage\.googleapis\.com\//,'Prepared gallery photos must bypass the secondary image optimiser');
        assert.ok(await locator.locator('img').evaluate(i=>i.complete&&i.naturalWidth>0));
      }
      results.push({preparedGalleryImageDelivery:'direct; both poster and thumbnail loaded'});
      await context.close();
    }
  } finally { await browser.close(); }
  return results;
}
