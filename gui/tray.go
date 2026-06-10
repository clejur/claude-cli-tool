package main

import (
	"os"
	"time"

	"github.com/getlantern/systray"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

var trayApp *App
var mShow *systray.MenuItem
var mQuit *systray.MenuItem

func (a *App) setupTray() {
	trayApp = a
	go systray.Run(onTrayReady, nil)
}

func onTrayReady() {
	systray.SetIcon(trayIconData)
	systray.SetTitle("Claude CLI Launcher")
	systray.SetTooltip("Claude CLI Launcher")

	lang := "en"
	if trayApp != nil {
		cfg, err := trayApp.store.Load()
		if err == nil && cfg.Settings.Language != "" {
			lang = cfg.Settings.Language
		}
	}

	if lang == "zh" {
		mShow = systray.AddMenuItem("显示", "显示窗口")
		systray.AddSeparator()
		mQuit = systray.AddMenuItem("退出", "退出应用")
	} else {
		mShow = systray.AddMenuItem("Show", "Show window")
		systray.AddSeparator()
		mQuit = systray.AddMenuItem("Quit", "Quit application")
	}

	go func() {
		for {
			select {
			case <-mShow.ClickedCh:
				showFromTray()
			case <-mQuit.ClickedCh:
				quitFromTray()
			}
		}
	}()
}

func (a *App) updateTrayLanguage(lang string) {
	if mShow == nil || mQuit == nil {
		return
	}
	if lang == "zh" {
		mShow.SetTitle("显示")
		mShow.SetTooltip("显示窗口")
		mQuit.SetTitle("退出")
		mQuit.SetTooltip("退出应用")
	} else {
		mShow.SetTitle("Show")
		mShow.SetTooltip("Show window")
		mQuit.SetTitle("Quit")
		mQuit.SetTooltip("Quit application")
	}
}

func showFromTray() {
	if trayApp != nil && trayApp.ctx != nil {
		wailsRuntime.WindowShow(trayApp.ctx)
	}
}

func quitFromTray() {
	systray.Quit()
	time.Sleep(100 * time.Millisecond)
	os.Exit(0)
}

func removeTray() {
	systray.Quit()
}
