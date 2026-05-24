package main

import (
	"os"
	"time"

	"github.com/energye/systray"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

var trayApp *App

func (a *App) setupTray() {
	trayApp = a
	go systray.Run(onTrayReady, nil)
}

func onTrayReady() {
	systray.SetIcon(trayIconData)
	systray.SetTitle("Claude Launcher")
	systray.SetTooltip("Claude Launcher")

	mShow := systray.AddMenuItem("Show", "Show window")
	systray.AddSeparator()
	mQuit := systray.AddMenuItem("Quit", "Quit application")

	mShow.Click(func() {
		showFromTray()
	})
	mQuit.Click(func() {
		quitFromTray()
	})

	systray.SetOnClick(func(menu systray.IMenu) {
		showFromTray()
	})
	systray.SetOnDClick(func(menu systray.IMenu) {
		showFromTray()
	})
	systray.SetOnRClick(func(menu systray.IMenu) {
		menu.ShowMenu()
	})
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
