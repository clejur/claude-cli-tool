package main

import (
	"os"
	"syscall"
	"unsafe"
)

var (
	procCreateMutex = kernel32.NewProc("CreateMutexW")
	procFindWindow  = user32.NewProc("FindWindowW")
)

const (
	errorAlreadyExists = 183
)

func ensureSingleInstance() {
	name, _ := syscall.UTF16PtrFromString("ClaudeLauncherSingleInstance")
	_, _, err := procCreateMutex.Call(0, 0, uintptr(unsafe.Pointer(name)))
	if err.(syscall.Errno) == errorAlreadyExists {
		activateExistingWindow()
		os.Exit(0)
	}
}

func activateExistingWindow() {
	title, _ := syscall.UTF16PtrFromString("Claude Launcher")
	hwnd, _, _ := procFindWindow.Call(0, uintptr(unsafe.Pointer(title)))
	if hwnd == 0 {
		return
	}

	iconic, _, _ := procIsIconic.Call(hwnd)
	if iconic != 0 {
		procShowWindow.Call(hwnd, uintptr(swRestore))
	} else {
		procShowWindow.Call(hwnd, uintptr(swShow))
	}
	procSetForegroundWindow.Call(hwnd)
}
