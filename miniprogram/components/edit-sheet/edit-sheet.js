Component({
  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: '编辑内容' },
    value: { type: String, value: '' },
    placeholder: { type: String, value: '请输入内容' },
    confirmText: { type: String, value: '保存' },
    maxLength: { type: Number, value: 80 }
  },
  data: {
    draft: ''
  },
  observers: {
    value(value) {
      this.setData({ draft: String(value || '') })
    },
    visible(visible) {
      if (visible) this.setData({ draft: String(this.properties.value || '') })
    }
  },
  methods: {
    stop() {},
    handleInput(event) {
      this.setData({ draft: event.detail.value })
    },
    cancel() {
      this.triggerEvent('cancel')
    },
    confirm() {
      const value = String(this.data.draft || '').trim()
      if (!value) {
        wx.showToast({ title: '内容不能为空', icon: 'none' })
        return
      }
      this.triggerEvent('confirm', { value })
    }
  }
})
