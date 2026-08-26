import { DEFAULT_LOCALE, LOCALES, LOCALE_CODES, type Locale } from './config';
import { getToolUrl, getToolIdFromSlug } from '@/data/tools';

// Import all translation files statically for Astro SSG compatibility
import enCommon from './translations/en/common.json';
import enHome from './translations/en/home.json';
import enTools from './translations/en/tools.json';
import enResizer from './translations/en/resizer.json';
import enExact from './translations/en/exact-resizer.json';
import enWebpComp from './translations/en/webp-compressor.json';
import enCmMm from './translations/en/cm-mm-resizer.json';
import enPan from './translations/en/pan-resizer.json';
import enWa from './translations/en/whatsapp-resizer.json';
import enSsc from './translations/en/ssc-resizer.json';
import enYt from './translations/en/youtube-resizer.json';
import enB64 from './translations/en/base64-converter.json';
import enDataUri from './translations/en/data-uri-converter.json';
import enDimCheck from './translations/en/dimensions-checker.json';
import enSizeCheck from './translations/en/file-size-checker.json';
import enResCheck from './translations/en/resolution-checker.json';
import enRatioCheck from './translations/en/aspect-ratio-checker.json';
import enDpiCheck from './translations/en/dpi-checker.json';
import enFmtCheck from './translations/en/format-checker.json';
import enSquareResizer from './translations/en/square-resizer.json';
import enCircleCropper from './translations/en/circle-cropper.json';
import enGrayscaleConverter from './translations/en/grayscale-converter.json';
import enImageInverter from './translations/en/image-inverter.json';
import enImageBlur from './translations/en/image-blur.json';
import enImageStitcher from './translations/en/image-stitcher.json';
import enScreenshotBeautifier from './translations/en/screenshot-beautifier.json';
import enPlaceholderGenerator from './translations/en/image-placeholder-generator.json';
import enImageOverlay from './translations/en/image-overlay-tool.json';
import enImageMosaic from './translations/en/image-mosaic-generator.json';
import enFreeformCrop from './translations/en/freeform-image-cropper.json';
import enNoiseReducer from './translations/en/image-noise-reducer.json';
import enProductWhiteBg from './translations/en/product-image-white-background.json';
import enVidTrim from './translations/en/video-trimmer.json';
import enVidRotate from './translations/en/video-rotator.json';
import enYtThumbnail from './translations/en/youtube-thumbnail-resizer.json';
import enFbCover from './translations/en/facebook-cover-resizer.json';
import enSvgResizer from './translations/en/svg-resizer.json';
import enDpiConv from './translations/en/dpi-converter.json';
import enImgToText from './translations/en/image-to-text.json';
import enGifExt from './translations/en/gif-frame-extractor.json';
import enPassport from './translations/en/passport-photo-maker.json';
import enSrcset from './translations/en/image-srcset-generator.json';
import enRenamer from './translations/en/batch-rename-images.json';

import esCommon from './translations/es/common.json';
import esHome from './translations/es/home.json';
import esTools from './translations/es/tools.json';
import esResizer from './translations/es/resizer.json';
import esExact from './translations/es/exact-resizer.json';
import esWebpComp from './translations/es/webp-compressor.json';
import esCmMm from './translations/es/cm-mm-resizer.json';
import esPan from './translations/es/pan-resizer.json';
import esWa from './translations/es/whatsapp-resizer.json';
import esSsc from './translations/es/ssc-resizer.json';
import esYt from './translations/es/youtube-resizer.json';
import esB64 from './translations/es/base64-converter.json';
import esDataUri from './translations/es/data-uri-converter.json';
import esDimCheck from './translations/es/dimensions-checker.json';
import esSizeCheck from './translations/es/file-size-checker.json';
import esResCheck from './translations/es/resolution-checker.json';
import esRatioCheck from './translations/es/aspect-ratio-checker.json';
import esDpiCheck from './translations/es/dpi-checker.json';
import esFmtCheck from './translations/es/format-checker.json';
import esSquareResizer from './translations/es/square-resizer.json';
import esCircleCropper from './translations/es/circle-cropper.json';
import esGrayscaleConverter from './translations/es/grayscale-converter.json';
import esImageInverter from './translations/es/image-inverter.json';
import esImageBlur from './translations/es/image-blur.json';
import esImageStitcher from './translations/es/image-stitcher.json';
import esScreenshotBeautifier from './translations/es/screenshot-beautifier.json';
import esPlaceholderGenerator from './translations/es/image-placeholder-generator.json';
import esImageOverlay from './translations/es/image-overlay-tool.json';
import esImageMosaic from './translations/es/image-mosaic-generator.json';
import esFreeformCrop from './translations/es/freeform-image-cropper.json';
import esNoiseReducer from './translations/es/image-noise-reducer.json';
import esProductWhiteBg from './translations/es/product-image-white-background.json';
import esVidTrim from './translations/es/video-trimmer.json';
import esVidRotate from './translations/es/video-rotator.json';
import esYtThumbnail from './translations/es/youtube-thumbnail-resizer.json';
import esFbCover from './translations/es/facebook-cover-resizer.json';
import esSvgResizer from './translations/es/svg-resizer.json';
import esDpiConv from './translations/es/dpi-converter.json';
import esImgToText from './translations/es/image-to-text.json';
import esGifExt from './translations/es/gif-frame-extractor.json';
import esPassport from './translations/es/passport-photo-maker.json';
import esSrcset from './translations/es/image-srcset-generator.json';
import esRenamer from './translations/es/batch-rename-images.json';

import ptCommon from './translations/pt/common.json';
import ptHome from './translations/pt/home.json';
import ptTools from './translations/pt/tools.json';
import ptResizer from './translations/pt/resizer.json';
import ptExact from './translations/pt/exact-resizer.json';
import ptWebpComp from './translations/pt/webp-compressor.json';
import ptCmMm from './translations/pt/cm-mm-resizer.json';
import ptPan from './translations/pt/pan-resizer.json';
import ptWa from './translations/pt/whatsapp-resizer.json';
import ptSsc from './translations/pt/ssc-resizer.json';
import ptYt from './translations/pt/youtube-resizer.json';
import ptB64 from './translations/pt/base64-converter.json';
import ptDataUri from './translations/pt/data-uri-converter.json';
import ptDimCheck from './translations/pt/dimensions-checker.json';
import ptSizeCheck from './translations/pt/file-size-checker.json';
import ptResCheck from './translations/pt/resolution-checker.json';
import ptRatioCheck from './translations/pt/aspect-ratio-checker.json';
import ptDpiCheck from './translations/pt/dpi-checker.json';
import ptFmtCheck from './translations/pt/format-checker.json';
import ptSquareResizer from './translations/pt/square-resizer.json';
import ptCircleCropper from './translations/pt/circle-cropper.json';
import ptGrayscaleConverter from './translations/pt/grayscale-converter.json';
import ptImageInverter from './translations/pt/image-inverter.json';
import ptImageBlur from './translations/pt/image-blur.json';
import ptImageStitcher from './translations/pt/image-stitcher.json';
import ptScreenshotBeautifier from './translations/pt/screenshot-beautifier.json';
import ptPlaceholderGenerator from './translations/pt/image-placeholder-generator.json';
import ptImageOverlay from './translations/pt/image-overlay-tool.json';
import ptImageMosaic from './translations/pt/image-mosaic-generator.json';
import ptFreeformCrop from './translations/pt/freeform-image-cropper.json';
import ptNoiseReducer from './translations/pt/image-noise-reducer.json';
import ptProductWhiteBg from './translations/pt/product-image-white-background.json';
import ptVidTrim from './translations/pt/video-trimmer.json';
import ptVidRotate from './translations/pt/video-rotator.json';
import ptYtThumbnail from './translations/pt/youtube-thumbnail-resizer.json';
import ptFbCover from './translations/pt/facebook-cover-resizer.json';
import ptSvgResizer from './translations/pt/svg-resizer.json';
import ptDpiConv from './translations/pt/dpi-converter.json';
import ptImgToText from './translations/pt/image-to-text.json';
import ptGifExt from './translations/pt/gif-frame-extractor.json';
import ptPassport from './translations/pt/passport-photo-maker.json';
import ptSrcset from './translations/pt/image-srcset-generator.json';
import ptRenamer from './translations/pt/batch-rename-images.json';

import frCommon from './translations/fr/common.json';
import frHome from './translations/fr/home.json';
import frTools from './translations/fr/tools.json';
import frResizer from './translations/fr/resizer.json';
import frExact from './translations/fr/exact-resizer.json';
import frWebpComp from './translations/fr/webp-compressor.json';
import frCmMm from './translations/fr/cm-mm-resizer.json';
import frPan from './translations/fr/pan-resizer.json';
import frWa from './translations/fr/whatsapp-resizer.json';
import frSsc from './translations/fr/ssc-resizer.json';
import frYt from './translations/fr/youtube-resizer.json';
import frB64 from './translations/fr/base64-converter.json';
import frDataUri from './translations/fr/data-uri-converter.json';
import frDimCheck from './translations/fr/dimensions-checker.json';
import frSizeCheck from './translations/fr/file-size-checker.json';
import frResCheck from './translations/fr/resolution-checker.json';
import frRatioCheck from './translations/fr/aspect-ratio-checker.json';
import frDpiCheck from './translations/fr/dpi-checker.json';
import frFmtCheck from './translations/fr/format-checker.json';
import frSquareResizer from './translations/fr/square-resizer.json';
import frCircleCropper from './translations/fr/circle-cropper.json';
import frGrayscaleConverter from './translations/fr/grayscale-converter.json';
import frImageInverter from './translations/fr/image-inverter.json';
import frImageBlur from './translations/fr/image-blur.json';
import frImageStitcher from './translations/fr/image-stitcher.json';
import frScreenshotBeautifier from './translations/fr/screenshot-beautifier.json';
import frPlaceholderGenerator from './translations/fr/image-placeholder-generator.json';
import frImageOverlay from './translations/fr/image-overlay-tool.json';
import frImageMosaic from './translations/fr/image-mosaic-generator.json';
import frFreeformCrop from './translations/fr/freeform-image-cropper.json';
import frNoiseReducer from './translations/fr/image-noise-reducer.json';
import frProductWhiteBg from './translations/fr/product-image-white-background.json';
import frVidTrim from './translations/fr/video-trimmer.json';
import frVidRotate from './translations/fr/video-rotator.json';
import frYtThumbnail from './translations/fr/youtube-thumbnail-resizer.json';
import frFbCover from './translations/fr/facebook-cover-resizer.json';
import frSvgResizer from './translations/fr/svg-resizer.json';
import frDpiConv from './translations/fr/dpi-converter.json';
import frImgToText from './translations/fr/image-to-text.json';
import frGifExt from './translations/fr/gif-frame-extractor.json';
import frPassport from './translations/fr/passport-photo-maker.json';
import frSrcset from './translations/fr/image-srcset-generator.json';
import frRenamer from './translations/fr/batch-rename-images.json';

import deCommon from './translations/de/common.json';
import deHome from './translations/de/home.json';
import deTools from './translations/de/tools.json';
import deResizer from './translations/de/resizer.json';
import deExact from './translations/de/exact-resizer.json';
import deWebpComp from './translations/de/webp-compressor.json';
import deCmMm from './translations/de/cm-mm-resizer.json';
import dePan from './translations/de/pan-resizer.json';
import deWa from './translations/de/whatsapp-resizer.json';
import deSsc from './translations/de/ssc-resizer.json';
import deYt from './translations/de/youtube-resizer.json';
import deB64 from './translations/de/base64-converter.json';
import deDataUri from './translations/de/data-uri-converter.json';
import deDimCheck from './translations/de/dimensions-checker.json';
import deSizeCheck from './translations/de/file-size-checker.json';
import deResCheck from './translations/de/resolution-checker.json';
import deRatioCheck from './translations/de/aspect-ratio-checker.json';
import deDpiCheck from './translations/de/dpi-checker.json';
import deFmtCheck from './translations/de/format-checker.json';
import deSquareResizer from './translations/de/square-resizer.json';
import deCircleCropper from './translations/de/circle-cropper.json';
import deGrayscaleConverter from './translations/de/grayscale-converter.json';
import deImageInverter from './translations/de/image-inverter.json';
import deImageBlur from './translations/de/image-blur.json';
import deImageStitcher from './translations/de/image-stitcher.json';
import deScreenshotBeautifier from './translations/de/screenshot-beautifier.json';
import dePlaceholderGenerator from './translations/de/image-placeholder-generator.json';
import deImageOverlay from './translations/de/image-overlay-tool.json';
import deImageMosaic from './translations/de/image-mosaic-generator.json';
import deFreeformCrop from './translations/de/freeform-image-cropper.json';
import deNoiseReducer from './translations/de/image-noise-reducer.json';
import deProductWhiteBg from './translations/de/product-image-white-background.json';
import deVidTrim from './translations/de/video-trimmer.json';
import deVidRotate from './translations/de/video-rotator.json';
import deYtThumbnail from './translations/de/youtube-thumbnail-resizer.json';
import deFbCover from './translations/de/facebook-cover-resizer.json';
import deSvgResizer from './translations/de/svg-resizer.json';
import deDpiConv from './translations/de/dpi-converter.json';
import deImgToText from './translations/de/image-to-text.json';
import deGifExt from './translations/de/gif-frame-extractor.json';
import dePassport from './translations/de/passport-photo-maker.json';
import deSrcset from './translations/de/image-srcset-generator.json';
import deRenamer from './translations/de/batch-rename-images.json';

import idCommon from './translations/id/common.json';
import idHome from './translations/id/home.json';
import idTools from './translations/id/tools.json';
import idResizer from './translations/id/resizer.json';
import idExact from './translations/id/exact-resizer.json';
import idWebpComp from './translations/id/webp-compressor.json';
import idCmMm from './translations/id/cm-mm-resizer.json';
import idPan from './translations/id/pan-resizer.json';
import idWa from './translations/id/whatsapp-resizer.json';
import idSsc from './translations/id/ssc-resizer.json';
import idYt from './translations/id/youtube-resizer.json';
import idB64 from './translations/id/base64-converter.json';
import idDataUri from './translations/id/data-uri-converter.json';
import idDimCheck from './translations/id/dimensions-checker.json';
import idSizeCheck from './translations/id/file-size-checker.json';
import idResCheck from './translations/id/resolution-checker.json';
import idRatioCheck from './translations/id/aspect-ratio-checker.json';
import idDpiCheck from './translations/id/dpi-checker.json';
import idFmtCheck from './translations/id/format-checker.json';
import idSquareResizer from './translations/id/square-resizer.json';
import idCircleCropper from './translations/id/circle-cropper.json';
import idGrayscaleConverter from './translations/id/grayscale-converter.json';
import idImageInverter from './translations/id/image-inverter.json';
import idImageBlur from './translations/id/image-blur.json';
import idImageStitcher from './translations/id/image-stitcher.json';
import idScreenshotBeautifier from './translations/id/screenshot-beautifier.json';
import idPlaceholderGenerator from './translations/id/image-placeholder-generator.json';
import idImageOverlay from './translations/id/image-overlay-tool.json';
import idImageMosaic from './translations/id/image-mosaic-generator.json';
import idFreeformCrop from './translations/id/freeform-image-cropper.json';
import idNoiseReducer from './translations/id/image-noise-reducer.json';
import idProductWhiteBg from './translations/id/product-image-white-background.json';
import idVidTrim from './translations/id/video-trimmer.json';
import idVidRotate from './translations/id/video-rotator.json';
import idYtThumbnail from './translations/id/youtube-thumbnail-resizer.json';
import idFbCover from './translations/id/facebook-cover-resizer.json';
import idSvgResizer from './translations/id/svg-resizer.json';
import idDpiConv from './translations/id/dpi-converter.json';
import idImgToText from './translations/id/image-to-text.json';
import idGifExt from './translations/id/gif-frame-extractor.json';
import idPassport from './translations/id/passport-photo-maker.json';
import idSrcset from './translations/id/image-srcset-generator.json';
import idRenamer from './translations/id/batch-rename-images.json';

import trCommon from './translations/tr/common.json';
import trHome from './translations/tr/home.json';
import trTools from './translations/tr/tools.json';
import trResizer from './translations/tr/resizer.json';
import trExact from './translations/tr/exact-resizer.json';
import trWebpComp from './translations/tr/webp-compressor.json';
import trCmMm from './translations/tr/cm-mm-resizer.json';
import trPan from './translations/tr/pan-resizer.json';
import trWa from './translations/tr/whatsapp-resizer.json';
import trSsc from './translations/tr/ssc-resizer.json';
import trYt from './translations/tr/youtube-resizer.json';
import trB64 from './translations/tr/base64-converter.json';
import trDataUri from './translations/tr/data-uri-converter.json';
import trDimCheck from './translations/tr/dimensions-checker.json';
import trSizeCheck from './translations/tr/file-size-checker.json';
import trResCheck from './translations/tr/resolution-checker.json';
import trRatioCheck from './translations/tr/aspect-ratio-checker.json';
import trDpiCheck from './translations/tr/dpi-checker.json';
import trFmtCheck from './translations/tr/format-checker.json';
import trSquareResizer from './translations/tr/square-resizer.json';
import trCircleCropper from './translations/tr/circle-cropper.json';
import trGrayscaleConverter from './translations/tr/grayscale-converter.json';
import trImageInverter from './translations/tr/image-inverter.json';
import trImageBlur from './translations/tr/image-blur.json';
import trImageStitcher from './translations/tr/image-stitcher.json';
import trScreenshotBeautifier from './translations/tr/screenshot-beautifier.json';
import trPlaceholderGenerator from './translations/tr/image-placeholder-generator.json';
import trImageOverlay from './translations/tr/image-overlay-tool.json';
import trImageMosaic from './translations/tr/image-mosaic-generator.json';
import trFreeformCrop from './translations/tr/freeform-image-cropper.json';
import trNoiseReducer from './translations/tr/image-noise-reducer.json';
import trProductWhiteBg from './translations/tr/product-image-white-background.json';
import trVidTrim from './translations/tr/video-trimmer.json';
import trVidRotate from './translations/tr/video-rotator.json';
import trYtThumbnail from './translations/tr/youtube-thumbnail-resizer.json';
import trFbCover from './translations/tr/facebook-cover-resizer.json';
import trSvgResizer from './translations/tr/svg-resizer.json';
import trDpiConv from './translations/tr/dpi-converter.json';
import trImgToText from './translations/tr/image-to-text.json';
import trGifExt from './translations/tr/gif-frame-extractor.json';
import trPassport from './translations/tr/passport-photo-maker.json';
import trSrcset from './translations/tr/image-srcset-generator.json';
import trRenamer from './translations/tr/batch-rename-images.json';

import itCommon from './translations/it/common.json';
import itHome from './translations/it/home.json';
import itTools from './translations/it/tools.json';
import itResizer from './translations/it/resizer.json';
import itExact from './translations/it/exact-resizer.json';
import itWebpComp from './translations/it/webp-compressor.json';
import itCmMm from './translations/it/cm-mm-resizer.json';
import itPan from './translations/it/pan-resizer.json';
import itWa from './translations/it/whatsapp-resizer.json';
import itSsc from './translations/it/ssc-resizer.json';
import itYt from './translations/it/youtube-resizer.json';
import itB64 from './translations/it/base64-converter.json';
import itDataUri from './translations/it/data-uri-converter.json';
import itDimCheck from './translations/it/dimensions-checker.json';
import itSizeCheck from './translations/it/file-size-checker.json';
import itResCheck from './translations/it/resolution-checker.json';
import itRatioCheck from './translations/it/aspect-ratio-checker.json';
import itDpiCheck from './translations/it/dpi-checker.json';
import itFmtCheck from './translations/it/format-checker.json';
import itSquareResizer from './translations/it/square-resizer.json';
import itCircleCropper from './translations/it/circle-cropper.json';
import itGrayscaleConverter from './translations/it/grayscale-converter.json';
import itImageInverter from './translations/it/image-inverter.json';
import itImageBlur from './translations/it/image-blur.json';
import itImageStitcher from './translations/it/image-stitcher.json';
import itScreenshotBeautifier from './translations/it/screenshot-beautifier.json';
import itPlaceholderGenerator from './translations/it/image-placeholder-generator.json';
import itImageOverlay from './translations/it/image-overlay-tool.json';
import itImageMosaic from './translations/it/image-mosaic-generator.json';
import itFreeformCrop from './translations/it/freeform-image-cropper.json';
import itNoiseReducer from './translations/it/image-noise-reducer.json';
import itProductWhiteBg from './translations/it/product-image-white-background.json';
import itVidTrim from './translations/it/video-trimmer.json';
import itVidRotate from './translations/it/video-rotator.json';
import itYtThumbnail from './translations/it/youtube-thumbnail-resizer.json';
import itFbCover from './translations/it/facebook-cover-resizer.json';
import itSvgResizer from './translations/it/svg-resizer.json';
import itDpiConv from './translations/it/dpi-converter.json';
import itImgToText from './translations/it/image-to-text.json';
import itGifExt from './translations/it/gif-frame-extractor.json';
import itPassport from './translations/it/passport-photo-maker.json';
import itSrcset from './translations/it/image-srcset-generator.json';
import itRenamer from './translations/it/batch-rename-images.json';

type TranslationMap = Record<string, string>;

/** All translations indexed by locale, with all namespaces merged into a flat map */
const translations: Record<Locale, TranslationMap> = {
  en: { ...enCommon, ...enHome, ...enTools, ...enResizer, ...enExact, ...enWebpComp, ...enCmMm, ...enPan, ...enWa, ...enSsc, ...enYt, ...enB64, ...enDataUri, ...enDimCheck, ...enSizeCheck, ...enResCheck, ...enRatioCheck, ...enDpiCheck, ...enFmtCheck, ...enSquareResizer, ...enCircleCropper, ...enGrayscaleConverter, ...enImageInverter, ...enImageBlur, ...enImageStitcher, ...enScreenshotBeautifier, ...enPlaceholderGenerator, ...enImageOverlay, ...enImageMosaic, ...enFreeformCrop, ...enNoiseReducer, ...enProductWhiteBg, ...enVidTrim, ...enVidRotate, ...enYtThumbnail, ...enFbCover, ...enSvgResizer, ...enDpiConv, ...enImgToText, ...enGifExt, ...enPassport, ...enSrcset, ...enRenamer },
  es: { ...esCommon, ...esHome, ...esTools, ...esResizer, ...esExact, ...esWebpComp, ...esCmMm, ...esPan, ...esWa, ...esSsc, ...esYt, ...esB64, ...esDataUri, ...esDimCheck, ...esSizeCheck, ...esResCheck, ...esRatioCheck, ...esDpiCheck, ...esFmtCheck, ...esSquareResizer, ...esCircleCropper, ...esGrayscaleConverter, ...esImageInverter, ...esImageBlur, ...esImageStitcher, ...esScreenshotBeautifier, ...esPlaceholderGenerator, ...esImageOverlay, ...esImageMosaic, ...esFreeformCrop, ...esNoiseReducer, ...esProductWhiteBg, ...esVidTrim, ...esVidRotate, ...esYtThumbnail, ...esFbCover, ...esSvgResizer, ...esDpiConv, ...esImgToText, ...esGifExt, ...esPassport, ...esSrcset, ...esRenamer },
  pt: { ...ptCommon, ...ptHome, ...ptTools, ...ptResizer, ...ptExact, ...ptWebpComp, ...ptCmMm, ...ptPan, ...ptWa, ...ptSsc, ...ptYt, ...ptB64, ...ptDataUri, ...ptDimCheck, ...ptSizeCheck, ...ptResCheck, ...ptRatioCheck, ...ptDpiCheck, ...ptFmtCheck, ...ptSquareResizer, ...ptCircleCropper, ...ptGrayscaleConverter, ...ptImageInverter, ...ptImageBlur, ...ptImageStitcher, ...ptScreenshotBeautifier, ...ptPlaceholderGenerator, ...ptImageOverlay, ...ptImageMosaic, ...ptFreeformCrop, ...ptNoiseReducer, ...ptProductWhiteBg, ...ptVidTrim, ...ptVidRotate, ...ptYtThumbnail, ...ptFbCover, ...ptSvgResizer, ...ptDpiConv, ...ptImgToText, ...ptGifExt, ...ptPassport, ...ptSrcset, ...ptRenamer },
  fr: { ...frCommon, ...frHome, ...frTools, ...frResizer, ...frExact, ...frWebpComp, ...frCmMm, ...frPan, ...frWa, ...frSsc, ...frYt, ...frB64, ...frDataUri, ...frDimCheck, ...frSizeCheck, ...frResCheck, ...frRatioCheck, ...frDpiCheck, ...frFmtCheck, ...frSquareResizer, ...frCircleCropper, ...frGrayscaleConverter, ...frImageInverter, ...frImageBlur, ...frImageStitcher, ...frScreenshotBeautifier, ...frPlaceholderGenerator, ...frImageOverlay, ...frImageMosaic, ...frFreeformCrop, ...frNoiseReducer, ...frProductWhiteBg, ...frVidTrim, ...frVidRotate, ...frYtThumbnail, ...frFbCover, ...frSvgResizer, ...frDpiConv, ...frImgToText, ...frGifExt, ...frPassport, ...frSrcset, ...frRenamer },
  de: { ...deCommon, ...deHome, ...deTools, ...deResizer, ...deExact, ...deWebpComp, ...deCmMm, ...dePan, ...deWa, ...deSsc, ...deYt, ...deB64, ...deDataUri, ...deDimCheck, ...deSizeCheck, ...deResCheck, ...deRatioCheck, ...deDpiCheck, ...deFmtCheck, ...deSquareResizer, ...deCircleCropper, ...deGrayscaleConverter, ...deImageInverter, ...deImageBlur, ...deImageStitcher, ...deScreenshotBeautifier, ...dePlaceholderGenerator, ...deImageOverlay, ...deImageMosaic, ...deFreeformCrop, ...deNoiseReducer, ...deProductWhiteBg, ...deVidTrim, ...deVidRotate, ...deYtThumbnail, ...deFbCover, ...deSvgResizer, ...deDpiConv, ...deImgToText, ...deGifExt, ...dePassport, ...deSrcset, ...deRenamer },
  id: { ...idCommon, ...idHome, ...idTools, ...idResizer, ...idExact, ...idWebpComp, ...idCmMm, ...idPan, ...idWa, ...idSsc, ...idYt, ...idB64, ...idDataUri, ...idDimCheck, ...idSizeCheck, ...idResCheck, ...idRatioCheck, ...idDpiCheck, ...idFmtCheck, ...idSquareResizer, ...idCircleCropper, ...idGrayscaleConverter, ...idImageInverter, ...idImageBlur, ...idImageStitcher, ...idScreenshotBeautifier, ...idPlaceholderGenerator, ...idImageOverlay, ...idImageMosaic, ...idFreeformCrop, ...idNoiseReducer, ...idProductWhiteBg, ...idVidTrim, ...idVidRotate, ...idYtThumbnail, ...idFbCover, ...idSvgResizer, ...idDpiConv, ...idImgToText, ...idGifExt, ...idPassport, ...idSrcset, ...idRenamer },
  tr: { ...trCommon, ...trHome, ...trTools, ...trResizer, ...trExact, ...trWebpComp, ...trCmMm, ...trPan, ...trWa, ...trSsc, ...trYt, ...trB64, ...trDataUri, ...trDimCheck, ...trSizeCheck, ...trResCheck, ...trRatioCheck, ...trDpiCheck, ...trFmtCheck, ...trSquareResizer, ...trCircleCropper, ...trGrayscaleConverter, ...trImageInverter, ...trImageBlur, ...trImageStitcher, ...trScreenshotBeautifier, ...trPlaceholderGenerator, ...trImageOverlay, ...trImageMosaic, ...trFreeformCrop, ...trNoiseReducer, ...trProductWhiteBg, ...trVidTrim, ...trVidRotate, ...trYtThumbnail, ...trFbCover, ...trSvgResizer, ...trDpiConv, ...trImgToText, ...trGifExt, ...trPassport, ...trSrcset, ...trRenamer },
  it: { ...itCommon, ...itHome, ...itTools, ...itResizer, ...itExact, ...itWebpComp, ...itCmMm, ...itPan, ...itWa, ...itSsc, ...itYt, ...itB64, ...itDataUri, ...itDimCheck, ...itSizeCheck, ...itResCheck, ...itRatioCheck, ...itDpiCheck, ...itFmtCheck, ...itSquareResizer, ...itCircleCropper, ...itGrayscaleConverter, ...itImageInverter, ...itImageBlur, ...itImageStitcher, ...itScreenshotBeautifier, ...itPlaceholderGenerator, ...itImageOverlay, ...itImageMosaic, ...itFreeformCrop, ...itNoiseReducer, ...itProductWhiteBg, ...itVidTrim, ...itVidRotate, ...itYtThumbnail, ...itFbCover, ...itSvgResizer, ...itDpiConv, ...itImgToText, ...itGifExt, ...itPassport, ...itSrcset, ...itRenamer },
};

/**
 * Get a translated string. Throws if the key is missing.
 * NEVER falls back to English. Missing keys = build-time error.
 */
export function t(locale: Locale, key: string): string {
  const map = translations[locale];
  if (!map) {
    throw new Error(`[i18n] Unknown locale: "${locale}"`);
  }
  const value = map[key];
  if (value === undefined || value === '') {
    throw new Error(
      `[i18n] Missing translation for key "${key}" in locale "${locale}". ` +
        `This is a build-breaking error. Add the translation to src/i18n/translations/${locale}/.`
    );
  }
  return value;
}

/**
 * Extract the locale from a URL pathname.
 * Returns DEFAULT_LOCALE ('en') if no locale prefix is found.
 */
export function getLocaleFromUrl(url: URL): Locale {
  const segments = url.pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  if (firstSegment && firstSegment in LOCALES && firstSegment !== DEFAULT_LOCALE) {
    return firstSegment as Locale;
  }
  return DEFAULT_LOCALE;
}

/**
 * Generate a locale-aware path.
 * Dynamically resolves tool URLs with localized slugs when appropriate.
 * 
 * @param path - The base path (e.g., '/', '/tools/', '/tools/image-to-data-uri-converter/')
 * @param locale - The target locale
 */
export function getLocalizedPath(path: string, locale: Locale): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Check if path contains a localized tool slug
  const segments = normalizedPath.split('/').filter(Boolean);
  const possibleSlug = segments.find((seg) => getToolIdFromSlug(seg) !== null);

  if (possibleSlug) {
    const toolId = getToolIdFromSlug(possibleSlug)!;
    return getToolUrl(toolId, locale);
  }

  if (locale === DEFAULT_LOCALE) {
    return normalizedPath;
  }

  // Remove any existing locale prefix first
  let cleanPath = normalizedPath;
  for (const code of LOCALE_CODES) {
    if (code !== DEFAULT_LOCALE && cleanPath.startsWith(`/${code}/`)) {
      cleanPath = cleanPath.slice(code.length + 1);
      break;
    }
    if (code !== DEFAULT_LOCALE && cleanPath === `/${code}`) {
      cleanPath = '/';
      break;
    }
  }

  if (cleanPath === '/') {
    return `/${locale}/`;
  }

  return `/${locale}${cleanPath}`;
}

/**
 * Generate hreflang alternate links for all locales.
 * Used in <head> for SEO.
 * 
 * @param currentPath - The current page path
 */
export function getAlternateLinks(
  currentPath: string
): { locale: string; hreflang: string; href: string }[] {
  const links = LOCALE_CODES.map((code) => ({
    locale: code,
    hreflang: LOCALES[code].hreflang,
    href: `https://imgfeel.com${getLocalizedPath(currentPath, code)}`,
  }));

  links.push({
    locale: 'x-default',
    hreflang: 'x-default',
    href: `https://imgfeel.com${getLocalizedPath(currentPath, DEFAULT_LOCALE)}`,
  });

  return links;
}

/**
 * Get the base path (without locale prefix) from a full URL pathname.
 */
export function getBasePathFromUrl(url: URL): string {
  const segments = url.pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && firstSegment in LOCALES && firstSegment !== DEFAULT_LOCALE) {
    const rest = segments.slice(1).join('/');
    return rest ? `/${rest}/` : '/';
  }

  return url.pathname;
}
