import { $, $$, extend, isUndefined, elementData } from './helpers/helpers'
import Stage from './Stage'
import Canvas from './Canvas'
import o from 'riot-observable'

/**
 * There is no need to listen several times all the window events
 * with this class we listen them once and we subscribe/unsubscribe all the Parallax instances to the main events dispatcher
 * @type {Stage}
 */
var stage

/**
 * @class
 * An awesome script
 */
class Parallax {
  constructor(els, opts = {}) {

    // make this object observable
    o(this)
    // set the options extending the _defaults
    this.opts = opts
    this.canvases = []
    this.add(els)
    if (!this.canvases.length)
      return console.warn(`No images were found with the selector "${els}"`) // undefined
    // lazy stage instance initialization
    if (!stage)
      stage = new Stage()

    return this
  }
  /**
   * Initialize the parallax
   * @returns { Object } - Parallax
   */
  init() {
    this.imagesLoaded = 0
    this.bind()
    return this
  }
  /**
   * Bind the instance events setting all the callbacks
   * @returns { Object } - Parallax
   */
  bind() {

    // cache these function in order to unbind them when
    // this instance will be destroyed
    this._onResize = (...args) => this.resize.apply(this, args)
    this._onScroll = (...args) => this.scroll.apply(this, args)

    stage.on('resize', this._onResize)
    stage.on('scroll', this._onScroll)

    this.canvases.forEach((canvas) => {
      canvas.one('loaded', () => this.onCanvasLoaded(canvas))
      canvas.load()
    })

    return this
  }
  /**
   * Force manually a redraw
   * @returns { Object } - Parallax
   */
  refresh() {
    this.onResize(stage.size).onScroll(stage.scrollTop)
    return this
  }
  /**
   * Callback triggered once a canvas has loaded its image
   * @param   { Object } canvas - canvas instance
   * @returns { Object } - Parallax
   */
  onCanvasLoaded(canvas) {
    this.trigger('image:loaded', canvas.img, canvas)
    this.imagesLoaded ++
    canvas.draw(stage)
    if (this.imagesLoaded == this.canvases.length) this.trigger('images:loaded')
    return this
  }
  /**
   * Callback triggered on scroll
   * @param   { Number } scrollTop - page offset top
   * @returns { Object } - Parallax
   */
  scroll(scrollTop) {
    var i = this.canvases.length

    while (i--) {

      var canvas = this.canvases[i],
        stageScrollTop = stage.scrollTop,
        canvasHeight = canvas.size.height,
        offsetYBounds = this.opts.offsetYBounds,
        canvasOffset = canvas.offset,
        canvasScrollDelta = canvasOffset.top + canvasHeight - stageScrollTop

      if (
        canvas.isLoaded &&
        canvasScrollDelta + offsetYBounds > 0 &&
        canvasScrollDelta - offsetYBounds < stageScrollTop + stage.height
      ) {
        canvas.draw(stage)
        this.trigger('draw', canvas.img)
      }

    }

    return this
  }
  /**
   * Add parallax elements to this parallax instance
   * @param { String|Array } els - DOM selector or node list
   * @returns { Object } - Parallax
   */
  add(els) {
    this.canvases = this.canvases.concat(this.createCanvases($$(els)))
    return this
  }
  /**
   * Remove parallax elements from this parallax instance
   * @param { String|Array } els - DOM selector or node list
   * @returns { Object } - Parallax
   */
  remove(els) {
    $$(els).forEach((el) => {
      var i = this.canvases.length
      while (i--) {
        if (el == this.canvases[i].img) {
          this.canvases.splice(i, 1)
          break
        }
      }
    })
    return this
  }
  /**
   * Kill all the internal and external callbacks listening this instance events
   * @returns { Object } - Parallax
   */
  destroy() {
    this.off('*')
    stage.off('resize', this._onResize).off('scroll', this._onScroll)
    return this
  }
  /**
   * Callback triggered on window resize
   * @param   { Object } size - object containing the window width and height
   * @returns { Object } - Parallax
   */
  resize(size) {
    var i = this.canvases.length
    while (i--) {
      var canvas = this.canvases[i]
      if (!canvas.isLoaded) return
      canvas.update().draw(stage)
    }
    this.trigger('resize')
    return this
  }
  /**
   * Set the canvases instances
   * @param   { Array } els - list of the images we want to parallax
   * @returns { Array } - list of canvas instances
   */
  createCanvases(els) {
    return els.map(el => {
      var data = elementData(el)
      return new Canvas(el, {
        intensity: !isUndefined(data.intensity) ? +data.intensity : this.opts.intensity,
        center: !isUndefined(data.center) ? +data.center : this.opts.center
      })
    })
  }
  /**
   * The options will be always set extending the script _defaults
   * @param   { Object } opts - custom options
   */
  set opts (opts) {
    this._defaults = {
      offsetYBounds: 50,
      intensity: 30,
      center: 0.5
    }
    extend(this._defaults, opts)
  }
  /**
   * Get the script options object
   * @returns { Object } - current options
   */
  get opts() {
    return this._defaults
  }
}

export default Parallax