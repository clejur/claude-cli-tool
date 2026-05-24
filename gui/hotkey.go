package main

import (
	"syscall"
	"unsafe"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

var (
	user32             = syscall.NewLazyDLL("user32.dll")
	procRegisterHotKey = user32.NewProc("RegisterHotKey")
	procGetMessage     = user32.NewProc("GetMessageW")
)

const (
	modCtrl   = 0x0002
	modShift  = 0x0004
	vkC       = 0x43
	wmHotkey  = 0x0312
	hotkeyID  = 1
)

type msg struct {
	Hwnd    uintptr
	Message uint32
	WParam  uintptr
	LParam  uintptr
	Time    uint32
	Pt      struct{ X, Y int32 }
}

func (a *App) registerHotkey() {
	go func() {
		procRegisterHotKey.Call(0, hotkeyID, modCtrl|modShift, vkC)
		var m msg
		for {
			ret, _, _ := procGetMessage.Call(uintptr(unsafe.Pointer(&m)), 0, 0, 0)
			if ret == 0 {
				break
			}
			if m.Message == wmHotkey {
				wailsRuntime.WindowShow(a.ctx)
			}
		}
	}()
}
