import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const modulePath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const base = process.env.BETA_TEST_URL || 'http://localhost:3003';
const output = process.env.BETA_TEST_OUTPUT || '/tmp/bindlab-beta-browser';
await fs.mkdir(output, { recursive: true });
const errors = []; const consoleErrors = []; const checks = []; let failures = 0;
const browser = await chromium.launch({ headless: true, ...(process.env.BETA_CHROME_PATH ? { executablePath: process.env.BETA_CHROME_PATH } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text().slice(0,500)); });
page.on('response', response => { if (response.url().includes('/_next/') && response.status() >= 400) errors.push(`Asset load failure ${response.status()}`); });
page.setDefaultTimeout(15000);
async function check(name, test) { try { await test(); checks.push({ name, status: 'passed' }); console.log(JSON.stringify({name,status:'passed'})); } catch (error) { failures++; console.log(JSON.stringify({name,status:'failed',error:error.message})); checks.push({ name, status: 'failed', error: String(error.message).slice(0,500) }); await page.screenshot({ path: path.join(output, `failure-${failures}.png`), fullPage: true }); } }
async function navigate(url) { await page.goto(base + url); await page.waitForLoadState('networkidle'); }
async function clickLink(name) { await page.getByRole('link', { name, exact: true }).first().click(); await page.waitForLoadState('networkidle'); }
await check('Landing page → dashboard → new experiment', async () => {
  await navigate('/'); assert(await page.getByLabel('Researcher beta disclosure').isVisible());
  const links = await page.getByRole('link').allTextContents(); await fs.writeFile(path.join(output,'landing-links.json'), JSON.stringify(links));
  const dashboard = page.locator('a[href="/dashboard"]').first(); await dashboard.click(); await page.waitForURL('**/dashboard');
  await clickLink('New Reaction'); await page.getByRole('button', { name: 'Build manually', exact:true }).waitFor();
});
let firstUrl; let secondUrl; let csvPath; let backupPath;
await check('Manual builder, fictional example, field confirmation, rescaling and CSV', async () => {
  await navigate('/dashboard/reaction/new'); await page.getByRole('button', { name: 'Load Synthetic Example', exact: true }).click();
  assert.equal(await page.getByLabel('Experiment title', { exact: true }).inputValue(), 'Synthetic Alpha + Beta preparation');
  await page.getByText('Field evidence and confirmation', { exact: true }).click();
  await page.getByRole('button', { name: 'Confirm Fictional Alpha mass', exact: true }).click();
  const massRow = page.getByRole('row').filter({ has: page.getByRole('cell', { name: 'mass', exact: true }) }).filter({ has: page.getByRole('cell', { name: 'Fictional Alpha', exact: true }) });
  assert((await massRow.innerText()).includes('Researcher Confirmed'));
  await page.getByLabel('Starting mass or amount', { exact: true }).fill('200');
  assert((await page.locator('body').innerText()).includes('20 mL'));
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export preparation CSV', exact: true }).click(); const file = await download; csvPath=path.join(output,file.suggestedFilename()); await file.saveAs(csvPath);
  const csv = await fs.readFile(csvPath,'utf8'); assert(csv.includes('"Fictional Beta","Rescaled mass","450","mg","Calculated"')); assert(csv.includes('Researcher Confirmed'));
  const backup = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download experiment backup', exact: true }).click(); const b=await backup; backupPath=path.join(output,b.suggestedFilename()); await b.saveAs(backupPath);
});
await check('Draft save, reload and independent record navigation', async () => {
  await page.getByRole('button', { name: 'Save unfinished draft locally', exact: true }).click(); await page.waitForURL('**/dashboard/experiments/*'); firstUrl=page.url();
  await page.reload(); await page.waitForLoadState('networkidle'); assert.equal(await page.getByLabel('Starting mass or amount', { exact: true }).inputValue(),'200');
  await navigate('/dashboard/reaction/new'); await page.getByLabel('Experiment title', { exact: true }).fill('Independent beta record');
  await page.getByRole('button', { name: 'Save unfinished draft locally', exact: true }).click(); await page.waitForURL('**/dashboard/experiments/*'); secondUrl=page.url(); assert.notEqual(firstUrl,secondUrl);
  await navigate('/dashboard/experiments'); const links=page.getByRole('link', { name:'Open record', exact:true }); assert.equal(await links.count(),2);
  await page.goto(firstUrl); await page.waitForLoadState('networkidle'); assert.equal(await page.getByLabel('Experiment title', { exact:true }).inputValue(),'Synthetic Alpha + Beta preparation');
  await page.goto(secondUrl); await page.waitForLoadState('networkidle'); assert.equal(await page.getByLabel('Experiment title', { exact:true }).inputValue(),'Independent beta record');
});
await check('Backup import creates a copy; malformed import rejected', async () => {
  assert(backupPath); await navigate('/dashboard/experiments'); await page.getByLabel('Import backup', { exact:true }).setInputFiles(backupPath); await page.waitForTimeout(300); assert.equal(await page.getByRole('link', { name:'Open record', exact:true }).count(),3);
  await page.getByLabel('Import backup', { exact:true }).setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{}')}); assert(await page.getByRole('alert').filter({hasText:'Unsupported backup'}).isVisible());
});
await check('Parts calculator units and invalid-input explanations', async () => {
  await navigate('/dashboard/calculators'); const section=page.locator('section').filter({has:page.getByRole('heading',{name:'X Parts in Y Parts Calculator',exact:true})});
  assert((await section.innerText()).includes('Add 1 mL TFA for 2 L water.'));
  await section.getByLabel('Actual water available',{exact:true}).fill('2000'); await section.getByLabel('Actual B unit').selectOption('mL'); assert((await section.innerText()).includes('for 2000 mL water.'));
  await section.getByLabel('Actual water available',{exact:true}).fill('500'); await section.getByLabel('Actual B unit').selectOption('uL'); assert((await section.innerText()).includes('for 500 µL water.'));
  await section.getByLabel('Reference amount B',{exact:true}).fill('0'); assert((await section.innerText()).includes('positive finite number'));
});
await check('LC-MS/HPLC workspace and calculator sections render', async () => {
  assert(await page.getByRole('heading',{name:'LCMS sample dilution calculator',exact:true}).first().isVisible());
  assert(await page.getByRole('heading',{name:'HPLC run solvent consumption calculator',exact:true}).first().isVisible());
  await navigate('/dashboard/lcms'); assert(page.url().endsWith('/analysis')); assert((await page.locator('main').innerText()).length>100);
});
await check('AI mocked success, missing fields, consent and apply', async () => {
  assert(backupPath); const backup=JSON.parse(await fs.readFile(backupPath,'utf8')); const draft=backup.experiments[0]; draft.conditions.temperature=null;
  await page.route('**/api/ai/experiment-builder', route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,draft})}));
  await navigate('/dashboard/reaction/new'); await page.getByRole('button',{name:'Build with AI',exact:true}).click(); await page.getByLabel('Experimental procedure',{exact:true}).fill('Synthetic public procedure for automated test.');
  assert(await page.getByRole('button',{name:'Generate Experiment',exact:true}).isDisabled());
  await page.getByLabel('I am authorized to submit',{exact:false}).check(); await page.getByRole('button',{name:'Generate Experiment',exact:true}).click(); await page.getByText('Editable extracted draft',{exact:true}).waitFor();
  assert((await page.locator('body').innerText()).includes('Not specified — researcher confirmation required.'));
  await page.getByLabel('I reviewed the extracted evidence',{exact:false}).check(); await page.getByRole('button',{name:'Apply to Experiment Workspace',exact:true}).click(); await page.getByRole('heading',{name:'Extracted draft review',exact:true}).waitFor();
  await page.unroute('**/api/ai/experiment-builder');
});
await check('AI malformed response preserves inputs and ends loading', async () => {
  await page.route('**/api/ai/experiment-builder',route=>route.fulfill({status:502,contentType:'application/json',body:'not json'}));
  await page.getByRole('button',{name:'Generate Experiment',exact:true}).click(); await page.getByRole('button',{name:'Retry',exact:true}).waitFor(); assert.equal(await page.getByLabel('Experimental procedure',{exact:true}).inputValue(),'Synthetic public procedure for automated test.'); assert(await page.getByRole('button',{name:'Generate Experiment',exact:true}).isEnabled()); await page.unroute('**/api/ai/experiment-builder');
});
await check('Feedback failure, explicit download and acknowledged mocked delivery', async () => {
  await page.getByRole('button',{name:'Report a Problem / Give Feedback',exact:true}).click(); await page.getByLabel('Description',{exact:true}).fill('Synthetic beta feedback. No experimental data.');
  await page.route('**/api/feedback',route=>route.fulfill({status:503,contentType:'application/json',body:'{}'})); await page.getByRole('button',{name:'Submit feedback',exact:true}).click(); await page.getByText('Feedback was not delivered.',{exact:false}).waitFor();
  const download=page.waitForEvent('download'); await page.getByRole('button',{name:'Download feedback',exact:true}).click(); const file=await download; await file.saveAs(path.join(output,file.suggestedFilename()));
  await page.unroute('**/api/feedback'); await page.route('**/api/feedback',route=>{ const data=route.request().postDataJSON(); return route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({ok:true,receipt:data.id})}); });
  await page.getByRole('button',{name:'Submit feedback',exact:true}).click(); await page.getByText('Feedback submitted and stored for BindLab administrator review. Thank you.',{exact:true}).waitFor(); await page.unroute('**/api/feedback');
});
await check('Numeric calculator UI distinguishes zero, missing inputs and invalid calculations', async () => {
  await navigate('/dashboard/calculators');
  const section=name=>page.locator('section').filter({has:page.getByRole('heading',{name,exact:true,level:2})});
  const molarity=section('Molarity calculator'); await molarity.getByLabel('Moles',{exact:true}).fill('0'); assert((await molarity.innerText()).includes('0 M')); await molarity.getByLabel('Moles',{exact:true}).fill(''); await molarity.getByText('Calculation needs valid inputs',{exact:true}).waitFor(); assert(await molarity.getByText('Calculation needs valid inputs',{exact:true}).isVisible()); assert(!(await molarity.innerText()).includes('Calculation validated'));
  const lcms=section('LCMS sample dilution calculator'); await lcms.getByLabel('Sample volume',{exact:true}).fill('10'); await lcms.getByLabel('Solvent volume',{exact:true}).fill('990'); assert((await lcms.innerText()).includes('100x dilution, final 1000 uL'));
  const hplc=section('HPLC run solvent consumption calculator'); await hplc.getByLabel('Run time',{exact:true}).fill('10');await hplc.getByLabel('Number of runs',{exact:true}).fill('12');await hplc.getByLabel('Extra solvent',{exact:true}).fill('10');await hplc.getByText('52.8 mL total (48 mL base)',{exact:true}).waitFor();assert((await hplc.innerText()).includes('52.8 mL total (48 mL base)'));
  await hplc.getByLabel('Number of runs',{exact:true}).fill('1.5');await hplc.getByText('Number of runs must be a whole number.',{exact:true}).first().waitFor();assert((await hplc.innerText()).includes('whole number'));
});
await check('Browser PDF upload handles table, malformed and image-only files', async () => {
  await navigate('/dashboard/reaction/new');await page.getByRole('button',{name:'Build with AI',exact:true}).click();
  await page.getByLabel('Upload reaction PDF',{exact:false}).setInputFiles('test/beta/synthetic-table.pdf');await page.getByText('synthetic-table.pdf ready',{exact:false}).waitFor();
  await page.getByLabel('Upload reaction PDF',{exact:false}).setInputFiles('test/beta/malformed.pdf');await page.getByText('BindLab could not read this PDF. Try an accessible PDF.',{exact:true}).waitFor();
  await page.getByLabel('Upload reaction PDF',{exact:false}).setInputFiles('test/beta/synthetic-scanned.pdf');await page.getByText('synthetic-scanned.pdf ready',{exact:false}).waitFor();await page.getByLabel('I am authorized to submit',{exact:false}).check();assert(await page.getByRole('button',{name:'Generate Experiment',exact:true}).isEnabled());
});
await check('Configured email feedback fallback is available without claiming delivery', async () => {
  await page.getByRole('button',{name:'Report a Problem / Give Feedback',exact:true}).click();assert(await page.getByRole('button',{name:'Open email to send feedback',exact:true}).isVisible());
});
await check('Desktop and mobile layouts have no page overflow', async () => {
  for(const url of ['/', '/dashboard', '/dashboard/reaction/new','/dashboard/calculators','/dashboard/experiments','/analysis']) for (const width of [1440,390]) {await page.setViewportSize({width,height:900});await navigate(url);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);assert(!overflow,`${url} overflows at ${width}px`);await page.screenshot({path:path.join(output,`${url.replaceAll('/','-')||'home'}-${width}.png`),fullPage:true});}
});
await check('Live Bench demo loads without runtime exceptions', async () => { await navigate('/dashboard/bench-mode-demo'); assert((await page.locator('main').innerText()).includes('Bench')); });
await check('Stale-tab save protection and quota failure preserve the open form', async () => {
  assert(firstUrl); await page.goto(firstUrl); await page.waitForLoadState('networkidle');
  const other=await context.newPage(); other.on('pageerror',error=>errors.push(error.message)); await other.goto(firstUrl); await other.waitForLoadState('networkidle');
  await page.getByLabel('Experiment title',{exact:true}).fill('Updated in tab A'); await page.getByRole('button',{name:'Save unfinished draft locally',exact:true}).click(); await page.getByText('Saved on this browser. Researcher review is still required.',{exact:true}).waitFor();
  await other.getByLabel('Experiment title',{exact:true}).fill('Unsaved tab B edit'); await other.getByRole('button',{name:'Save unfinished draft locally',exact:true}).click(); await other.getByText('This record changed in another tab.',{exact:false}).waitFor(); assert.equal(await other.getByLabel('Experiment title',{exact:true}).inputValue(),'Unsaved tab B edit'); await other.close();
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='bindlab-canonical-experiments')throw new DOMException('Full','QuotaExceededError');return original.call(this,key,value);};});
  await page.getByLabel('Experiment title',{exact:true}).fill('Unsaved quota edit'); await page.getByRole('button',{name:'Save unfinished draft locally',exact:true}).click(); await page.getByText('Your changes have not been saved. Browser storage may be full or unavailable.',{exact:false}).waitFor(); assert.equal(await page.getByLabel('Experiment title',{exact:true}).inputValue(),'Unsaved quota edit');
});
await check('Normal browser restart retains a saved record in an isolated disk profile', async () => {
  const profile=await fs.mkdtemp(path.join(os.tmpdir(),'bindlab-beta-profile-')); const options={headless:true,...(process.env.BETA_CHROME_PATH?{executablePath:process.env.BETA_CHROME_PATH}:{})};
  let persistent=await chromium.launchPersistentContext(profile,options); let tab=await persistent.newPage(); tab.on('pageerror',error=>errors.push(error.message)); await tab.goto(base+'/dashboard/reaction/new'); await tab.getByLabel('Experiment title',{exact:true}).fill('Browser restart fixture'); await tab.getByRole('button',{name:'Save unfinished draft locally',exact:true}).click(); await tab.waitForURL('**/dashboard/experiments/*'); const url=tab.url(); await persistent.close();
  persistent=await chromium.launchPersistentContext(profile,options); tab=await persistent.newPage(); tab.on('pageerror',error=>errors.push(error.message)); await tab.goto(url); await tab.getByLabel('Experiment title',{exact:true}).waitFor(); assert.equal(await tab.getByLabel('Experiment title',{exact:true}).inputValue(),'Browser restart fixture'); await persistent.close(); await fs.rm(profile,{recursive:true,force:true});
});
await check('Browser runtime error audit', async () => { assert.deepEqual(errors,[]); assert.deepEqual(consoleErrors.filter(message => !/^Failed to load resource: the server responded with a status of (400|422|502|503)/.test(message)),[]); });
await fs.writeFile(path.join(output,'results.json'),JSON.stringify({checks,errors,consoleErrors,passed:checks.length-failures,failed:failures},null,2));
console.log(JSON.stringify({checks,errors,consoleErrors,passed:checks.length-failures,failed:failures,output},null,2));
await browser.close(); process.exitCode=failures?1:0;
