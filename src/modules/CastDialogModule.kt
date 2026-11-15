package com.x2004durgesh.uwumi.modules

import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Colours Google's Cast dialogs, which use the style in the activity theme's mediaRouteTheme. Each uwumi theme has
 * one, written by plugins/withCastDialogTheme.js, so the colours passed in aren't needed here.
 */
class CastDialogModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CastDialogModule")

    AsyncFunction("setTheme") { name: String, _: String, _: String, _: String, _: String ->
      val activity = appContext.currentActivity ?: return@AsyncFunction
      val style = activity.resources.getIdentifier("UwumiCastDialogOverlay_${name.replace('-', '_')}", "style", activity.packageName)
      if (style != 0) activity.theme.applyStyle(style, true)
    }.runOnQueue(Queues.MAIN)
  }
}
