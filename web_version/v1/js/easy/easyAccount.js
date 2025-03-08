import { app } from "../../../../scripts/app.js";
import { api } from "../../../../scripts/api.js";
import { $el, ComfyDialog } from "../../../../scripts/ui.js";
import { $t } from '../common/i18n.js'
import { toast } from "../common/toast.js";
import {sleep, accSub} from "../common/utils.js";

let api_keys = []
let api_current = 0
let user_info = {}

const api_cost = {
    'sd3': 6.5,
    'sd3-turbo': 4,
}

class AccountDialog extends ComfyDialog {
    constructor() {
		super();
        this.lists = []
        this.dialog_div = null
        this.user_div = null
	}

    addItem(index, user_div){
        return $el('div.easyuse-account-dialog-item',[
          $el('input',{type:'text',placeholder:'Enter name',oninput: e=>{
              const dataIndex = Array.prototype.indexOf.call(this.dialog_div.querySelectorAll('.easyuse-account-dialog-item'), e.target.parentNode)
              api_keys[dataIndex]['name'] = e.target.value
          },value:api_keys[index]['name']}),
          $el('input.key',{type:'text',oninput: e=>{
              const dataIndex = Array.prototype.indexOf.call(this.dialog_div.querySelectorAll('.easyuse-account-dialog-item'), e.target.parentNode)
              api_keys[dataIndex]['key'] = e.target.value
          },placeholder:'Enter APIKEY', value:api_keys[index]['key']}),
          $el('button.choose',{textContent:$t('Choose'),onclick:async(e)=>{
                const dataIndex = Array.prototype.indexOf.call(this.dialog_div.querySelectorAll('.easyuse-account-dialog-item'), e.target.parentNode)
                let name = api_keys[dataIndex]['name']
                let key = api_keys[dataIndex]['key']
                if(!name){
                    toast.error($t('Please enter the account name'))
                    return
                }
                else if(!key){
                    toast.error($t('Please enter the APIKEY'))
                    return
                }
                let missing = true
                for(let i=0;i<api_keys.length;i++){
                    if(!api_keys[i].key) {
                        missing = false
                        break
                    }
                }
                if(!missing){
                    toast.error($t('APIKEY is not Empty'))
                    return
                }
                // 保存记录
                api_current = dataIndex
                const body = new FormData();
                body.append('api_keys', JSON.stringify(api_keys));
                body.append('current',api_current)
                const res = await api.fetchApi('/easyuse/stability/set_api_keys', {
                    method: 'POST',
                    body
                })
                 if (res.status == 200) {
                    const data = await res.json()
                    if(data?.account && data?.balance){
                        const avatar = data.account?.profile_picture || null
                        const email = data.account?.email || null
                        const credits = data.balance?.credits || 0
                        user_div.replaceChildren(
                            $el('div.easyuse-account-user-info', {
                                onclick:_=>{
                                    new AccountDialog().show(user_div);
                                }
                            },[
                                $el('div.user',[
                                   $el('div.avatar', avatar ? [$el('img',{src:avatar})] : '😀'),
                                   $el('div.info', [
                                    $el('h5.name', email),
                                    $el('h6.remark','Credits: '+ credits)
                                   ])
                                ]),
                                $el('div.edit', {textContent:$t('Edit')})
                            ])
                        )
                        toast.success($t('Save Succeed'))
                    }
                    else toast.success($t('Save Succeed'))
                    this.close()
                } else {
                    toast.error($t('Save Failed'))
                }
          }}),
          $el('button.delete',{textContent:$t('Delete'),onclick:e=>{
              const dataIndex = Array.prototype.indexOf.call(this.dialog_div.querySelectorAll('.easyuse-account-dialog-item'), e.target.parentNode)
              if(api_keys.length<=1){
                toast.error($t('At least one account is required'))
                return
              }
              api_keys.splice(dataIndex,1)
              this.dialog_div.removeChild(e.target.parentNode)
          }}),
      ])
    }

    show(userdiv) {
        api_keys.forEach((item,index)=>{
          this.lists.push(this.addItem(index,userdiv))
        })
        this.dialog_div = $el("div.easyuse-account-dialog", this.lists)
		super.show(
            $el('div.easyuse-account-dialog-main',[
               $el('div',[
                    $el('a',{href:'https://platform.stability.ai/account/keys',target:'_blank',textContent:$t('Getting Your APIKEY')}),
                ]),
                this.dialog_div,
            ])
        );
	}

    createButtons() {
		const btns = super.createButtons();
        btns.unshift($el('button',{
            type:'button',
            textContent:$t('Save Account Info'),
            onclick:_=>{
                let missing = true
                for(let i=0;i<api_keys.length;i++){
                    if(!api_keys[i].key) {
                        missing = false
                        break
                    }
                }
                if(!missing){
                    toast.error($t('APIKEY is not Empty'))
                }
                else {
                    const body = new FormData();
                    body.append('api_keys', JSON.stringify(api_keys));
                    api.fetchApi('/easyuse/stability/set_api_keys', {
                        method: 'POST',
                        body
                    }).then(res => {
                        if (res.status == 200) {
                            toast.success($t('Save Succeed'))

                        } else {
                            toast.error($t('Save Failed'))
                        }
                    })
                }
            }
        }))
        btns.unshift($el('button',{
            type:'button',
            textContent:$t('Add Account'),
            onclick:_=>{
                const name = 'Account '+(api_keys.length).toString()
                api_keys.push({name,key:''})
                const item = this.addItem(api_keys.length - 1)
                this.lists.push(item)
                this.dialog_div.appendChild(item)
            }
        }))
        return btns
    }
}
