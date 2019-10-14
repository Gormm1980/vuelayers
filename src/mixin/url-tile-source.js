import { isEmpty, isEqual, isString, pick } from '../util/minilo'
import { obsFromOlEvent } from '../rx-ext'
import tileSource from './tile-source'

export default {
  mixins: [
    tileSource,
  ],
  props: {
    // ol/source/UrlTile
    tileLoadFunction: Function,
    tileUrlFunction: Function,
    url: {
      type: String,
      validator: value => isString(value) && !isEmpty(value),
    },
    urls: {
      type: Array,
      validator: value => value.every(url => isString(url) && !isEmpty(url)),
    },
  },
  watch: {
    tileLoadFunction (value) {
      this.setSourceTileLoadFunction(value)
    },
    tileUrlFunction (value) {
      this.setSourceTileUrlFunction(value)
    },
    url (value) {
      this.setSourceUrl(value)
    },
    urls (value) {
      this.setSourceUrls(value)
    },
  },
  methods: {
    /**
     * @returns {Promise<module:ol/Tile.LoadFunction>}
     */
    async getSourceTileLoadFunction () {
      return (await this.resolveSource()).getTileLoadFunction()
    },
    /**
     * @param {module:ol/Tile.LoadFunction} tileLoadFunction
     * @returns {Promise<void>}
     */
    async setSourceTileLoadFunction (tileLoadFunction) {
      const source = await this.resolveSource()

      if (tileLoadFunction === source.getTileLoadFunction()) return

      source.setTileLoadFunction(tileLoadFunction)
    },
    /**
     * @returns {Promise<module:ol/Tile.UrlFunction>}
     */
    async getSourceTileUrlFunction () {
      return (await this.resolveSource()).getTileUrlFunction()
    },
    /**
     * @param {module:ol/Tile.UrlFunction} tileUrlFunction
     * @param {number} [tileKey]
     * @returns {Promise<void>}
     */
    async setSourceTileUrlFunction (tileUrlFunction, tileKey) {
      const source = await this.resolveSource()

      if (tileUrlFunction === source.getTileUrlFunction()) return

      source.setTileUrlFunction(tileUrlFunction, tileKey)
    },
    /**
     * @returns {Promise<string[]|undefined>}
     */
    async getSourceUrls () {
      return (await this.resolveSource()).getUrls()
    },
    /**
     * @param {string[]} urls
     * @returns {Promise<void>}
     */
    async setSourceUrls (urls) {
      const source = await this.resolveSource()

      if (isEqual(urls, source.getUrls())) return

      source.setUrls(urls)
    },
    /**
     * @param {string} url
     * @returns {Promise<void>}
     */
    async setSourceUrl (url) {
      const source = await this.resolveSource()

      if (url === source.getUrl()) return

      source.setUrl(url)
    },
    /**
     * @returns {Promise<void>}
     */
    async subscribeAll () {
      await Promise.all([
        this::tileSource.methods.subscribeAll(),
        this::subscribeToSourceEvents(),
      ])
    },
    ...pick(tileSource.methods, [
      'init',
      'deinit',
      'mount',
      'unmount',
      'refresh',
      'scheduleRefresh',
      'remount',
      'scheduleRemount',
      'recreate',
      'scheduleRecreate',
      'getServices',
    ]),
  },
}

async function subscribeToSourceEvents () {
  const source = await this.resolveSource()

  const events = obsFromOlEvent(source, [
    'tileloadstart',
    'tileloadend',
    'tileloaderror',
  ])

  this.subscribeTo(events, evt => {
    ++this.rev

    this.$nextTick(() => {
      this.$emit(evt.type, evt)
    })
  })
}
