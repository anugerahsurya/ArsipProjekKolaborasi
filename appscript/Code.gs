/*
 * Backend Projek Artikel Ilmiah.
 *
 * Deploy: Deploy > New deployment > Web app
 *   Execute as      : Me
 *   Who has access  : Anyone
 * Salin URL /exec ke VITE_APPSCRIPT_URL di file .env (lokal) atau env Vercel/Netlify.
 *
 * Saat pertama dipanggil, script membuat folder "Artikel Ilmiah Surya" di Drive
 * pemilik script beserta spreadsheet database di dalamnya.
 */

const ROOT_FOLDER = 'Artikel Ilmiah Surya';
const DB_NAME = 'Database Projek Artikel Ilmiah';

const SHEETS = {
  checkpoint: ['project', 'topic', 'stepId', 'status', 'pic', 'catatan', 'updatedAt'],
  projek: ['project', 'status', 'updatedAt'],
  berkas: ['project', 'topic', 'jenis', 'nama', 'url', 'updatedAt'],
};

function doGet(e) {
  const p = e.parameter || {};
  if (p.action === 'projects') return json_({ ok: true, projects: rows_('projek') });
  if (p.action === 'state') {
    const byProject = (r) => r.project === p.project;
    return json_({
      ok: true,
      projek: rows_('projek').find(byProject) || null,
      checkpoints: rows_('checkpoint').filter(byProject),
      berkas: rows_('berkas').filter(byProject),
    });
  }
  return json_({ ok: false, error: 'action tidak dikenal' });
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const now = new Date().toISOString();
    switch (body.action) {
      case 'checkpoint':
        return json_({ ok: true, row: upsert_('checkpoint', ['project', 'topic', 'stepId'], {
          project: body.project, topic: body.topic, stepId: body.stepId,
          status: body.status, pic: body.pic || '', catatan: body.catatan || '', updatedAt: now,
        }) });

      case 'projectStatus':
        return json_({ ok: true, row: upsert_('projek', ['project'], {
          project: body.project, status: body.status, updatedAt: now,
        }) });

      case 'link':
        return json_({ ok: true, row: upsert_('berkas', ['project', 'topic', 'jenis'], {
          project: body.project, topic: body.topic, jenis: body.jenis,
          nama: body.nama || body.url, url: body.url, updatedAt: now,
        }) });

      case 'upload': {
        const folder = subfolder_(subfolder_(root_(), body.project), body.topic);
        const blob = Utilities.newBlob(Utilities.base64Decode(body.data), 'application/pdf', body.nama);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.COMMENT);
        return json_({ ok: true, row: upsert_('berkas', ['project', 'topic', 'jenis'], {
          project: body.project, topic: body.topic, jenis: body.jenis,
          nama: body.nama, url: file.getUrl(), updatedAt: now,
        }) });
      }
    }
    return json_({ ok: false, error: 'action tidak dikenal' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function root_() {
  const it = DriveApp.getFoldersByName(ROOT_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(ROOT_FOLDER);
}

function subfolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function db_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('DB_ID');
  if (id) return SpreadsheetApp.openById(id);

  const ss = SpreadsheetApp.create(DB_NAME);
  DriveApp.getFileById(ss.getId()).moveTo(root_());
  props.setProperty('DB_ID', ss.getId());
  return ss;
}

function sheet_(name) {
  const ss = db_();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(SHEETS[name]);
    sh.setFrozenRows(1);
    // sheet bawaan (Sheet1/Lembar1) tidak dipakai
    ss.getSheets().filter((s) => !(s.getName() in SHEETS)).forEach((s) => ss.deleteSheet(s));
  }
  return sh;
}

function rows_(name) {
  const values = sheet_(name).getDataRange().getValues();
  const head = values.shift();
  return values.map((v) => Object.fromEntries(head.map((h, i) => [h, v[i] instanceof Date ? v[i].toISOString() : v[i]])));
}

function upsert_(name, keys, obj) {
  const sh = sheet_(name);
  const head = SHEETS[name];
  const values = sh.getDataRange().getValues();
  const idx = values.findIndex((v, i) => i > 0 && keys.every((k) => String(v[head.indexOf(k)]) === String(obj[k])));
  const row = head.map((h) => obj[h] ?? '');
  if (idx > 0) sh.getRange(idx + 1, 1, 1, row.length).setValues([row]);
  else sh.appendRow(row);
  return obj;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
