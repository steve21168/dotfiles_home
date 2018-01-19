#!/bin/bash
set -euo pipefail

## Printers  ##

print_success() {
  # Print output in green
  printf "\e[0;32m  [✔] $1\e[0m\n"
}

print_error() {
  # Print output in red
  printf "\e[0;31m  [✖] $1 $2\e[0m\n"
}

print_result() {
  if [ $1 -eq 0 ]; then
    print_success "$2"
  else
    print_error "$2"
  fi
}

## Helpers ##

answer_is_yes() {
  [[ "$REPLY" =~ ^[Yy]$ ]] \
    && return 0 \
    || return 1
}

ask_for_confirmation() {
  print_question "$1 (y/n) "
  read -n 1
  printf "\n"
}

execute() {
  $1 &> /dev/null
  print_result $? "${2:-$1}"
}

##  Main Logic ##

DOTFILES=$(ls dotfiles/)

backup_old_files() {
  dotfile_backups="${HOME}/dotfile_backups"
  if [[ ! -d $dotfile_backups ]]; then
    mkdir $dotfile_backups
  fi

  for dotfile in ${DOTFILES[@]}; do
    dotfile_home_location=${HOME}/.$dotfile
    if [[ -e $dotfile_home_location ]]; then
      echo "Moving dotfile $dotfile_home_location from ~ to $dotfile_backups"
      mv $dotfile_home_location $dotfile_backups/
    fi
  done
}

symlink_dotfiles() {

  for dotfile in ${DOTFILES[@]}; do

    sourceFile="$(pwd)/dotfiles/$dotfile"
    targetFile="$HOME/.$dotfile"

    if [ ! -e "$targetFile" ]; then
      execute "ln -fs $sourceFile $targetFile" "$targetFile → $sourceFile"
    elif [ "$(readlink "$targetFile")" == "$sourceFile" ]; then
      print_success "$targetFile → $sourceFile"
    else
      ask_for_confirmation "'$targetFile' already exists, do you want to overwrite it?"
      if answer_is_yes; then
        rm -rf "$targetFile"
        execute "ln -fs $sourceFile $targetFile" "$targetFile → $sourceFile"
      else
        print_error "$targetFile → $sourceFile"
      fi
    fi
  done

}

install() {
  backup_old_files
  symlink_dotfiles
}

install
