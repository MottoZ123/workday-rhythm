const storage = require('../../utils/storage')
const statsDomain = require('../../utils/stats-domain')
const salaryDomain = require('../../utils/salary-domain')
const dateUtil = require('../../utils/date')
const funDomain = require('../../utils/fun-domain')
const share = require('../../utils/share')

Page({
  data: {
    fontMode: 'medium',
    dateText: '',
    stealthMode: false,
    report: {
      checklistCompleted: 0,
      checklistTotal: 0,
      checklistPercentage: 0,
      fishCount: 0,
      fishDurationText: '0秒',
      fishAmountText: '0.00',
      displayFishAmountText: '0.00',
      favorite: '暂无',
      earnedText: '0.00',
      displayEarnedText: '0.00'
    },
    quote: '',
    canvasReady: false
  },

  onShow() {
    this.state = storage.loadState()
    this.render()
  },

  render() {
    const now = new Date()
    const key = dateUtil.formatDateKey(now)
    const base = statsDomain.reportData(this.state, key, now)
    const live = salaryDomain.calculateLiveSnapshot(this.state.salary.settings, now)
    const stealthMode = Boolean(this.state.privacy && this.state.privacy.stealthMode)
    const hide = stealthMode && this.state.privacy.hideAmounts !== false
    const fishAmountText = salaryDomain.formatMoney(base.fishAmount, 2)
    const earnedText = salaryDomain.formatMoney(live.earned, 2)
    const report = {
      checklistCompleted: base.checklistCompleted,
      checklistTotal: base.checklistTotal,
      checklistPercentage: base.checklistPercentage,
      fishCount: base.fishCount,
      fishDurationText: dateUtil.humanDuration(base.fishSeconds),
      fishAmountText,
      displayFishAmountText: hide ? '••••' : fishAmountText,
      favorite: base.favorite,
      earnedText,
      displayEarnedText: hide ? '••••' : earnedText
    }
    this.setData({
      fontMode: (this.state.ui && this.state.ui.fontSizeMode) || 'medium',
      dateText: dateUtil.formatChineseDate(now),
      stealthMode,
      report,
      quote: funDomain.dailyCopy(key, 'report')
    }, () => setTimeout(() => this.drawReportCanvas(), 50))
  },

  buildText() {
    const r = this.data.report
    const line2 = this.data.stealthMode
      ? `今日休息：${r.fishDurationText}，记录 ${r.fishCount} 次`
      : `今日摸鱼：${r.fishDurationText}，${r.fishCount} 次，收益 ¥${r.fishAmountText}`
    const line3 = this.data.stealthMode
      ? `今日工作进度：${r.checklistCompleted}/${r.checklistTotal}`
      : `今日工资预计已赚：¥${r.earnedText}`
    return [
      '工休伴侣 · 今日日报',
      this.data.dateText,
      `清单完成：${r.checklistCompleted}/${r.checklistTotal}（${r.checklistPercentage}%）`,
      line2,
      `最常用类型：${r.favorite}`,
      line3,
      `“${this.data.quote}”`
    ].join('\n')
  },

  copyReport() {
    wx.setClipboardData({
      data: this.buildText(),
      success: () => wx.showToast({ title: '日报文字已复制', icon: 'success' })
    })
  },

  drawReportCanvas() {
    if (!wx.createCanvasContext) return
    const r = this.data.report
    const ctx = wx.createCanvasContext('reportCanvas', this)
    const W = 650
    const H = 880
    ctx.setFillStyle('#FFF8EA')
    ctx.fillRect(0, 0, W, H)

    ctx.setFillStyle('#F5E6CC')
    ctx.beginPath(); ctx.arc(560, 90, 86, 0, Math.PI * 2); ctx.fill()
    ctx.setFillStyle('#E8F1E5')
    ctx.beginPath(); ctx.arc(70, 760, 96, 0, Math.PI * 2); ctx.fill()

    ctx.setFillStyle('#3E2C24')
    ctx.setFontSize(32)
    ctx.fillText(this.data.stealthMode ? '今日工作日报' : '今日摸鱼日报', 48, 70)
    ctx.setFillStyle('#8D7B68')
    ctx.setFontSize(18)
    ctx.fillText(this.data.dateText, 48, 106)

    ctx.setFillStyle('#FFFFFF')
    ctx.setStrokeStyle('#E8D2AE')
    ctx.setLineWidth(2)
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(36, 145, 578, 220, 24)
    else ctx.rect(36, 145, 578, 220)
    ctx.fill(); ctx.stroke()

    ctx.setFillStyle('#5D7B6F')
    ctx.setFontSize(18)
    ctx.fillText('今日清单', 70, 190)
    ctx.setFillStyle('#3E2C24')
    ctx.setFontSize(44)
    ctx.fillText(`${r.checklistCompleted} / ${r.checklistTotal}`, 70, 250)
    ctx.setFillStyle('#9A8A7D')
    ctx.setFontSize(18)
    ctx.fillText(`完成率 ${r.checklistPercentage}%`, 70, 286)

    ctx.setFillStyle('#E97743')
    ctx.setFontSize(18)
    ctx.fillText(this.data.stealthMode ? '今日休息' : '今日摸鱼', 350, 190)
    ctx.setFillStyle('#3E2C24')
    ctx.setFontSize(36)
    ctx.fillText(r.fishDurationText, 350, 244)
    ctx.setFillStyle('#9A8A7D')
    ctx.setFontSize(18)
    ctx.fillText(`${r.fishCount} 次 · ${r.favorite}`, 350, 282)

    ctx.setFillStyle('#EAF2E7')
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(36, 390, 578, 156, 24)
    else ctx.rect(36, 390, 578, 156)
    ctx.fill()
    ctx.setFillStyle('#5D7B6F')
    ctx.setFontSize(18)
    ctx.fillText(this.data.stealthMode ? '今日工作进度值' : '今日已赚（预计）', 68, 432)
    ctx.setFillStyle('#3E2C24')
    ctx.setFontSize(48)
    ctx.fillText(`${this.data.stealthMode ? '' : '¥'}${r.displayEarnedText}`, 68, 496)
    ctx.setFillStyle('#A06D42')
    ctx.setFontSize(18)
    ctx.fillText(this.data.stealthMode ? '敏感金额已隐藏' : `摸鱼收益 ¥${r.displayFishAmountText}`, 68, 525)

    ctx.setFillStyle('#FFF0CF')
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(36, 574, 578, 170, 24)
    else ctx.rect(36, 574, 578, 170)
    ctx.fill()
    ctx.setFillStyle('#8B704E')
    ctx.setFontSize(20)
    ctx.fillText('今日一句', 68, 620)
    ctx.setFillStyle('#5A4739')
    ctx.setFontSize(22)
    const quote = this.data.quote || ''
    const first = quote.slice(0, 18)
    const second = quote.slice(18, 36)
    ctx.fillText(first, 68, 666)
    if (second) ctx.fillText(second, 68, 700)

    ctx.setFillStyle('#9A8C80')
    ctx.setFontSize(16)
    ctx.fillText('工休伴侣 · 数据仅保存在本机', 48, 828)
    ctx.draw(false, () => this.setData({ canvasReady: true }))
  },

  saveReportImage() {
    if (!this.data.canvasReady) {
      this.drawReportCanvas()
      wx.showToast({ title: '正在生成图片，请稍后再试', icon: 'none' })
      return
    }
    wx.canvasToTempFilePath({
      canvasId: 'reportCanvas',
      destWidth: 1300,
      destHeight: 1760,
      success: (result) => {
        wx.saveImageToPhotosAlbum({
          filePath: result.tempFilePath,
          success: () => wx.showToast({ title: '日报已保存到相册', icon: 'success' }),
          fail: () => wx.showModal({
            title: '暂时无法保存图片',
            content: '可能尚未授权保存到相册。你也可以先复制日报文字。',
            showCancel: false
          })
        })
      },
      fail: () => wx.showToast({ title: '图片生成失败', icon: 'none' })
    }, this)
  },

  onShareAppMessage() { return share.appMessage() },
  onShareTimeline() { return share.timeline() }
})
