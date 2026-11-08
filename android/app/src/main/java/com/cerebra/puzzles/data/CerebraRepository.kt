package com.cerebra.puzzles.data

import android.content.Context
import android.content.SharedPreferences

class CerebraRepository(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("cerebra_native_prefs", Context.MODE_PRIVATE)

    fun getUnlockedLevel(gameId: String): Int {
        return prefs.getInt("unlocked_$gameId", 1).coerceIn(1, 1000)
    }

    fun setUnlockedLevel(gameId: String, level: Int) {
        prefs.edit().putInt("unlocked_$gameId", level.coerceIn(1, 1000)).apply()
    }

    fun resetAll() {
        prefs.edit().clear().apply()
    }
}
