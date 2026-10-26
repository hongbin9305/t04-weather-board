import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0?bundle';
const cfg=await fetch('/api/config').then(x=>x.json());
const auth=createClient(cfg.url,cfg.publishableKey);
window.t07Auth=auth;
