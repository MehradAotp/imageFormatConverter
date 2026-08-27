const defaults={webpQuality:.92,jpgQuality:.9,avifQuality:.8,filenameMode:'original',maxWidth:0,maxHeight:0,jpegBackground:'#ffffff'};
const ids=['webpQuality','jpgQuality','avifQuality','filenameMode','maxWidth','maxHeight','jpegBackground','targetKB'];
const $=(id)=>document.querySelector(`#${id}`);
function labels(){for(const id of ['webpQuality','jpgQuality','avifQuality']) $(`${id}Value`).textContent=`${Math.round(Number($(id).value)*100)}%`;}
async function load(){const s=await chrome.storage.local.get({...defaults,targetKB:0});for(const id of ids){const element=$(id);if(element&&s[id]!==undefined) element.value=s[id];}labels();}
for(const id of ['webpQuality','jpgQuality','avifQuality']) $(id).addEventListener('input',labels);
$('save').addEventListener('click',async()=>{await chrome.storage.local.set({webpQuality:Number($('webpQuality').value),jpgQuality:Number($('jpgQuality').value),avifQuality:Number($('avifQuality').value),filenameMode:$('filenameMode').value,maxWidth:Number($('maxWidth').value)||0,maxHeight:Number($('maxHeight').value)||0,jpegBackground:$('jpegBackground').value,targetKB:Number($('targetKB').value)||0});$('status').textContent='Preferences saved.';setTimeout(()=>$('status').textContent='',2200);});
load();
