/*
This file defines how to map key values from the intermediate codes used here
(they're mostly compatible with AHK and xdotool) to native AHK and xdotool mappings.
Feel free to expand the list. If a key is not in this mappings it's redirected to the
underlying system as it's given. If it has a length of one it's lowercased. This is
the case to prevent any conflicts from different behaviour of uppercase letter
when it comes to the Shift modifier.
*/

import { MouseButton, ScrollDirection } from "./AHK";

/*
Entries are of type:
'Key to use in intermediate functions': ['AHK mapping', 'xdotool mapping']
Everything thatis not in here is not mapped and it may not work everywhere.
If you find a key that should be mapped and is not listed PLEASE create a PR.
All keys in this object must be lowercase but not the mappings. Feel free to
add multiple mappings if needed so it's easier for everyone to find a key.
This object tries to keep AHK and xdotool values so everyone can use what he prefers.
For example a-z is not mapped as it's the same on both AHK and xdotool
Plus and Comma are mapped as plaintext values because they're reserved inside
the `key(up|down)` functions.

You don't need to add mapping with and without underscores here as underscores are
replaced with nothing before to support both ways of expressing some keys. Exception
the single underscore. It matches to the underscore key.
*/
export const KEY_MAPPING: Record<string, [string, string]> = {
    // a-z not mapped. The indetifiers are equal.

    plus: ["+", "plus"],
    comma: [",", "comma"],
    caps: ["CapsLock", "Caps_Lock"],
    capslock: ["CapsLock", "Caps_Lock"],
    space: ["Space", "space"],
    tab: ["Tab", "Tab"],

    enter: ["Enter", "Return"],
    return: ["Enter", "Return"],

    escape: ["Escape", "Escape"],
    esc: ["Escape", "Escape"],

    backspace: ["Backspace", "BackSpace"],
    back: ["Backspace", "BackSpace"],
    bs: ["Backspace", "BackSpace"],

    delete: ["Delete", "Delete"],
    del: ["Delete", "Delete"],

    insert: ["Insert", "Insert"],
    ins: ["Insert", "Insert"],

    home: ["Home", "Home"],
    pos1: ["Home", "Home"],

    end: ["End", "End"],

    pageup: ["PgUp", "Page_Up"],
    pgup: ["PgUp", "Page_Up"],

    pagedown: ["PgDn", "Page_Down"],
    pgdn: ["PgDn", "Page_Down"],

    up: ["Up", "Up"],
    down: ["Down", "Down"],
    left: ["Left", "Left"],
    right: ["Right", "Right"],

    numpad0: ["Numpad0", "KP_0"],
    kp0: ["Numpad0", "KP_0"],
    numpadins: ["Numpad0", "KP_Insert"],
    numpadinsert: ["Numpad0", "KP_Insert"],
    kpins: ["Numpad0", "KP_Insert"],
    kpinsert: ["Numpad0", "KP_Insert"],

    numpad1: ["Numpad1", "KP_1"],
    kp1: ["Numpad1", "KP_1"],
    numpadend: ["Numpad1", "KP_End"],
    kpend: ["Numpad1", "KP_End"],

    numpad2: ["Numpad2", "KP_2"],
    kp2: ["Numpad2", "KP_2"],
    numpaddown: ["Numpad2", "KP_Down"],
    kpdown: ["Numpad2", "KP_Down"],

    numpad3: ["Numpad3", "KP_3"],
    kp3: ["Numpad3", "KP_3"],
    numpadpgdn: ["Numpad3", "KP_Page_Down"],
    numpadpagedown: ["Numpad3", "KP_Page_Down"],
    kppgdn: ["Numpad3", "KP_Page_Down"],
    kppagedown: ["Numpad3", "KP_Page_Down"],

    numpad4: ["Numpad4", "KP_4"],
    kp4: ["Numpad4", "KP_4"],
    numpadleft: ["Numpad4", "KP_Left"],
    kpleft: ["Numpad4", "KP_Left"],

    numpad5: ["Numpad5", "KP_5"],
    kp5: ["Numpad5", "KP_5"],
    numpadclear: ["Numpad5", "KP_Begin"],
    kpclear: ["Numpad5", "KP_Begin"],
    numpadbegin: ["Numpad5", "KP_Begin"],
    kpbegin: ["Numpad5", "KP_Begin"],

    numpad6: ["Numpad6", "KP_6"],
    kp6: ["Numpad6", "KP_6"],
    numpadright: ["Numpad6", "KP_Right"],
    kpright: ["Numpad6", "KP_Right"],

    numpad7: ["Numpad7", "KP_7"],
    kp7: ["Numpad7", "KP_7"],
    numpadhome: ["Numpad7", "KP_Home"],
    numpadpos1: ["Numpad7", "KP_Home"],
    kphome: ["Numpad7", "KP_Home"],
    kppos1: ["Numpad7", "KP_Home"],

    numpad8: ["Numpad8", "KP_8"],
    kp8: ["Numpad8", "KP_8"],
    numpadup: ["Numpad8", "KP_Up"],
    kpup: ["Numpad8", "KP_Up"],

    numpad9: ["Numpad9", "KP_9"],
    kp9: ["Numpad9", "KP_9"],
    numpadpgup: ["Numpad9", "KP_Page_Up"],
    numpadpageup: ["Numpad9", "KP_Page_Up"],
    kppgup: ["Numpad9", "KP_Page_Up"],
    kppageup: ["Numpad9", "KP_Page_Up"],

    numpaddot: ["NumpadDot", "KP_Separator"],
    numpadseparator: ["NumpadDot", "KP_Separator"],
    numpaddel: ["NumpadDot", "KP_Delete"],
    numpaddelete: ["NumpadDot", "KP_Delete"],

    numlock: ["NumLock", "Num_Lock"],

    numpaddiv: ["NumpadDiv", "KP_Divide"],
    numpaddivide: ["NumpadDiv", "KP_Divide"],
    kpdiv: ["NumpadDiv", "KP_Divide"],
    kpdivide: ["NumpadDiv", "KP_Divide"],

    numpadmult: ["NumpadMult", "KP_Multiply"],
    numpadmultiply: ["NumpadMult", "KP_Multiply"],
    kpmult: ["NumpadMult", "KP_Multiply"],
    kpmultiply: ["NumpadMult", "KP_Multiply"],

    numpadadd: ["NumpadAdd", "KP_Add"],
    numpadplus: ["NumpadAdd", "KP_Add"],
    kpadd: ["NumpadAdd", "KP_Add"],
    kpplus: ["NumpadAdd", "KP_Add"],

    numpadsub: ["NumpadSub", "KP_Subtract"],
    numpadsubtract: ["NumpadSub", "KP_Subtract"],
    numpadminus: ["NumpadSub", "KP_Subtract"],
    kpsub: ["NumpadSub", "KP_Subtract"],
    kpsubtract: ["NumpadSub", "KP_Subtract"],
    kpminus: ["NumpadSub", "KP_Subtract"],

    numpadenter: ["NumpadEnter", "KP_Enter"],
    numpadreturn: ["NumpadEnter", "KP_Enter"],
    kpenter: ["NumpadEnter", "KP_Enter"],
    kpreturn: ["NumpadEnter", "KP_Enter"],

    f1: ["F1", "F1"],
    f2: ["F2", "F2"],
    f3: ["F3", "F3"],
    f4: ["F4", "F4"],
    f5: ["F5", "F5"],
    f6: ["F6", "F6"],
    f7: ["F7", "F7"],
    f8: ["F8", "F8"],
    f9: ["F9", "F9"],
    f10: ["F10", "F10"],
    f11: ["F11", "F11"],
    f12: ["F12", "F12"],

    win: ["LWin", "Super"],
    windows: ["LWin", "Super"],
    super: ["LWin", "Super"],
    tux: ["LWin", "Super"],

    lwin: ["LWin", "Super_L"],
    lwindows: ["LWin", "Super_L"],
    lsuper: ["LWin", "Super_L"],
    ltux: ["LWin", "Super_L"],
    winl: ["LWin", "Super_L"],
    windowsl: ["LWin", "Super_L"],
    superl: ["LWin", "Super_L"],
    tuxl: ["LWin", "Super_L"],

    rwin: ["RWin", "Super_R"],
    rwindows: ["RWin", "Super_R"],
    rsuper: ["RWin", "Super_R"],
    rtux: ["RWin", "Super_R"],
    winr: ["RWin", "SupeSuper_Rr_R"],
    windowsr: ["RWin", "Super_R"],
    metar: ["", "Meta_R"],
    tuxr: ["RWin", "Super_R"],

    control: ["Control", "Control"],
    ctrl: ["Control", "Control"],

    lcontrol: ["LControl", "Control_L"],
    controll: ["LControl", "Control_L"],
    lctrl: ["LControl", "Control_L"],
    ctrll: ["LControl", "Control_L"],

    rcontrol: ["RControl", "Control_R"],
    controlr: ["RControl", "Control_R"],
    rctrl: ["RControl", "Control_R"],
    ctrlr: ["RControl", "Control_R"],

    alt: ["Alt", "Alt"],

    lalt: ["LAlt", "Alt_L"],
    altl: ["LAlt", "Alt_L"],

    ralt: ["RAlt", "Alt_R"],
    altr: ["RAlt", "Alt_R"],

    shift: ["Shift", "Shift"],

    lshift: ["LShift", "Shift_L"],
    shiftl: ["LShift", "Shift_L"],

    rshift: ["RShift", "Shift_R"],
    shiftr: ["RShift", "Shift_R"],

    menu: ["AppsKey", "Menu"],
    apps: ["AppsKey", "Menu"],
    appskey: ["AppsKey", "Menu"],

    printscreen: ["PrintScreen", "Print"],
    print: ["PrintScreen", "Print"],

    pause: ["Pause", "Pause"],
    break: ["Pause", "Pause"],

    "`": ["`", "grave"],
    "´": ["´", "acute"],
    "^": ["^", "asciicircum"],
    "°": ["^", "degree"],
    "~": ["~", "asciitilde"],
    // + is already handled at the very beginning
    "!": ["!", "exclam"],
    "#": ["#", "numbersign"],
    '"': ['""', "quotedbl"],
    "*": ["*", "asterisk"],
    "§": ["§", "section"],
    "&": ["&", "ampersand"],
    "/": ["/", "slash"],
    "(": ["(", "parenleft"],
    ")": [")", "parenright"],
    "[": ["[", "bracketleft"],
    "]": ["]", "bracketright"],
    "{": ["{", "braceleft"],
    "}": ["}", "braceright"],
    "?": ["?", "question"],
    ":": [":", "colon"],
    ";": [";", "semicolon"],
    "-": ["-", "minus"],
    _: ["_", "underscore"],
    "<": ["<", "less"],
    ">": [">", "greater"],
    "|": ["|", "bar"],
};

/*
Same as KEY_MAPPING but for mouse buttons.
*/
export const MOUSE_MAPPING: Record<MouseButton, [string, string]> = {
    left: ["LButton", "1"],
    middle: ["MButton", "2"],
    right: ["RButton", "3"],
    button4: ["XButton1", "8"],
    button5: ["XButton2", "9"],
};

/*
Same as KEY_MAPPING but for mousewheel direction.
*/
export const MOUSEWHEEL_MAPPING: Record<ScrollDirection, [string, string]> = {
    up: ["WheelUp", "4"],
    down: ["WheelDown", "5"],
    left: ["WheelLeft", "6"],
    right: ["WheelRight", "7"],
};
