package main

import (
	"os"

	"golang.org/x/sys/windows/registry"
)

const autoStartKey = `Software\Microsoft\Windows\CurrentVersion\Run`
const autoStartName = "ClaudeLauncher"

func (a *App) GetAutoStart() (bool, error) {
	k, err := registry.OpenKey(registry.CURRENT_USER, autoStartKey, registry.QUERY_VALUE)
	if err != nil {
		return false, nil
	}
	defer k.Close()
	_, _, err = k.GetStringValue(autoStartName)
	return err == nil, nil
}

func (a *App) SetAutoStart(enabled bool) error {
	k, _, err := registry.CreateKey(registry.CURRENT_USER, autoStartKey, registry.SET_VALUE)
	if err != nil {
		return err
	}
	defer k.Close()
	if enabled {
		exe, _ := os.Executable()
		return k.SetStringValue(autoStartName, exe)
	}
	_ = k.DeleteValue(autoStartName)
	return nil
}
