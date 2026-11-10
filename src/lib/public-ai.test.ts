import {afterEach,expect,it,vi} from 'vitest';
import {analyzePhoto} from './photo-search.functions';
import {analyzeRoom} from './room-photo.client';
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
it('does not upload furniture or prepare/upload room photographs from the production frontend',async()=>{
  vi.stubEnv('DEV',false);const fetchImpl=vi.fn();vi.stubGlobal('fetch',fetchImpl);
  expect(await analyzePhoto('data:image/jpeg;base64,unused')).toMatchObject({ok:false,code:'not_configured'});
  expect(await analyzeRoom('blob:unused',new AbortController().signal)).toMatchObject({ok:false,code:'not_configured'});
  expect(fetchImpl).not.toHaveBeenCalled();
});
