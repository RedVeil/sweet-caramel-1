
_git_setup ( ) {
    cat <<- EOF > $HOME/.netrc
      machine github.com
      login $GITHUB_ACTOR
      password $INPUT_GITHUB_TOKEN
      machine api.github.com
      login $GITHUB_ACTOR
      password $INPUT_GITHUB_TOKEN
EOF
    chmod 600 $HOME/.netrc

    git config --global user.email "actions@github.com"
    git config --global user.name "GitHub Action"
}

# Checks if any files are changed
_git_changed() {
    [[ -n "$(git status -s)" ]]
}

_git_changes() {
    git diff
}

cd "$GITHUB_ACTION_PATH"

echo "Installing prettier..."

yarn install prettier -W

yarn pretify

echo "Done"

if _git_changed; then
  # case when --write is used with dry-run so if something is unpretty there will always have _git_changed
  if $INPUT_DRY; then
    echo "Unpretty Files Changes:"
    _git_changes
    echo "Finishing dry-run. Exiting before committing."
    exit 1
  else
    # Calling method to configure the git environemnt
    _git_setup

    if $INPUT_ONLY_CHANGED; then
      # --diff-filter=d excludes deleted files
      OLDIFS="$IFS"
      IFS=$'\n'
      for file in $(git diff --name-only --diff-filter=d HEAD^..HEAD)
      do
        git add "$file"
      done
      IFS="$OLDIFS"
    else
      # Add changes to git
      git add "${INPUT_FILE_PATTERN}" || echo "Problem adding your files with pattern ${INPUT_FILE_PATTERN}"
    fi

    # Commit and push changes back
    if $INPUT_SAME_COMMIT; then
      echo "Amending the current commit..."
      git pull
      git commit --amend --no-edit
      git push origin -f
    else
      if [ "$INPUT_COMMIT_DESCRIPTION" != "" ]; then
          git commit -m "$INPUT_COMMIT_MESSAGE" -m "$INPUT_COMMIT_DESCRIPTION" --author="$GITHUB_ACTOR <$GITHUB_ACTOR@users.noreply.github.com>" ${INPUT_COMMIT_OPTIONS:+"$INPUT_COMMIT_OPTIONS"} || echo "No files added to commit"
      else
          git commit -m "$INPUT_COMMIT_MESSAGE" --author="$GITHUB_ACTOR <$GITHUB_ACTOR@users.noreply.github.com>" ${INPUT_COMMIT_OPTIONS:+"$INPUT_COMMIT_OPTIONS"} || echo "No files added to commit"
      fi
      git push origin ${INPUT_PUSH_OPTIONS:-}
    fi
    echo "Changes pushed successfully."
  fi
else
  # case when --check is used so there will never have something to commit but there are unpretty files
  if [ "$PRETTIER_RESULT" -eq 1 ]; then
    echo "Prettier found unpretty files!"
    exit 1
  else
    echo "Finishing dry-run."
  fi
  echo "No unpretty files!"
  echo "Nothing to commit. Exiting."
fi